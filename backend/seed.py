"""Fill the database with demo data.

    python seed.py            # wipe and reseed
    python seed.py --keep     # add data without wiping

Demo passwords come from the environment so nothing real is committed:
    DEMO_ADMIN_PASSWORD (default "admin12345")
    DEMO_CUSTOMER_PASSWORD (default "customer12345")
Credentials are printed at the end.
"""

import os
import random
import sys
from datetime import date, datetime, time, timedelta, timezone

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import Appointment, Counter, QueueToken, Service, ServiceHistory, User

ADMIN_PASSWORD = os.getenv("DEMO_ADMIN_PASSWORD", "admin12345")
CUSTOMER_PASSWORD = os.getenv("DEMO_CUSTOMER_PASSWORD", "customer12345")

SERVICES = [
    ("Document Verification", "Verify identity and address documents.", 10),
    ("Account Update", "Change contact details or account preferences.", 6),
    ("Application Submission", "Submit a new application and pay any fee.", 15),
    ("Card Services", "Collect, block or replace a card.", 8),
    ("General Enquiry", "Ask a question or get directed to the right desk.", 5),
]

CUSTOMERS = [
    "Aarav Sharma", "Diya Patel", "Rohan Mehta", "Ishita Rao", "Kabir Nair",
    "Ananya Iyer", "Vihaan Gupta", "Sara Khan",
]


def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed(db):
    now = datetime.now(timezone.utc)

    admin = User(
        name="Priya Desai",
        email="admin@smartqueue.dev",
        password_hash=hash_password(ADMIN_PASSWORD),
        role="admin",
    )
    db.add(admin)

    customers = [
        User(
            name=name,
            email=f"{name.split()[0].lower()}@smartqueue.dev",
            password_hash=hash_password(CUSTOMER_PASSWORD),
            role="customer",
        )
        for name in CUSTOMERS
    ]
    db.add_all(customers)

    services = [Service(name=n, description=d, average_duration=m) for n, d, m in SERVICES]
    db.add_all(services)

    counters = [
        Counter(name="Counter 1", status="SERVING"),
        Counter(name="Counter 2", status="AVAILABLE"),
        Counter(name="Counter 3", status="OFFLINE"),
    ]
    db.add_all(counters)
    db.flush()  # assign ids without committing

    token_counter = 0

    def next_number() -> str:
        nonlocal token_counter
        token_counter += 1
        return f"SQ-{100 + token_counter}"

    # --- 40 completed services spread over the last three days ---------------
    for i in range(40):
        service = random.choice(services)
        customer = random.choice(customers)
        counter = random.choice(counters[:2])

        created = now - timedelta(days=random.randint(0, 2), hours=random.randint(0, 8))
        waited = timedelta(minutes=random.randint(3, 40))
        # Real durations jitter around the configured average.
        served = timedelta(minutes=max(2, int(random.gauss(service.average_duration, 2.5))))

        token = QueueToken(
            token_number=next_number(),
            user_id=customer.id,
            service_id=service.id,
            counter_id=counter.id,
            priority=0,
            status="COMPLETED",
            created_at=created,
            called_at=created + waited,
            started_at=created + waited,
            completed_at=created + waited + served,
        )
        db.add(token)
        db.flush()
        db.add(
            ServiceHistory(
                token_id=token.id,
                service_id=service.id,
                counter_id=counter.id,
                service_duration=int(served.total_seconds()),
                waiting_duration=int(waited.total_seconds()),
                completed_at=token.completed_at,
            )
        )

    # --- a live queue to demo against ---------------------------------------
    serving = QueueToken(
        token_number=next_number(),
        user_id=customers[0].id,
        service_id=services[0].id,
        counter_id=counters[0].id,
        status="SERVING",
        created_at=now - timedelta(minutes=25),
        called_at=now - timedelta(minutes=4),
        started_at=now - timedelta(minutes=4),
    )
    db.add(serving)

    for i in range(12):
        db.add(
            QueueToken(
                token_number=next_number(),
                user_id=random.choice(customers).id,
                service_id=random.choice(services).id,
                priority=1 if i in (3, 8) else 0,  # two priority customers
                status="WAITING",
                created_at=now - timedelta(minutes=20 - i),
            )
        )

    for i in range(3):
        db.add(
            QueueToken(
                token_number=next_number(),
                user_id=random.choice(customers).id,
                service_id=random.choice(services).id,
                status="CANCELLED",
                created_at=now - timedelta(hours=2, minutes=i * 7),
                completed_at=now - timedelta(hours=1, minutes=i * 7),
            )
        )

    # --- appointments --------------------------------------------------------
    for i, customer in enumerate(customers[:6]):
        db.add(
            Appointment(
                user_id=customer.id,
                service_id=services[i % len(services)].id,
                appointment_date=date.today() + timedelta(days=i % 3),
                appointment_time=time(hour=10 + (i % 6)),
                status="SCHEDULED",
            )
        )

    db.commit()


def main():
    keep = "--keep" in sys.argv
    if not keep:
        reset_database()

    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()

    print("\nSmartQueue demo data ready.\n")
    print(f"  Admin     admin@smartqueue.dev / {ADMIN_PASSWORD}")
    print(f"  Customer  aarav@smartqueue.dev / {CUSTOMER_PASSWORD}")
    print(f"            (also diya@, rohan@, ishita@, kabir@, ananya@, vihaan@, sara@)\n")


if __name__ == "__main__":
    main()
