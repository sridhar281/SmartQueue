"""Waiting-time estimation.

The algorithm is deliberately simple arithmetic, not machine learning, because
it has to be explainable to the person standing in the queue:

    estimated wait = people ahead of you x average service time / open counters

1. "Average service time" is the mean of the last N completed services for that
   specific service type (default N = 20). Recent rows only, so the estimate
   follows today's reality rather than last month's.
2. If a service has fewer than MIN_SAMPLES completed rows, we fall back to the
   admin-configured Service.average_duration.
3. Dividing by the number of open counters matters: 5 people ahead with three
   counters open is roughly a third of the wait of one counter.

Worked example:
    Last 5 "Document Verification" services took 8, 10, 7, 9, 11 minutes.
    Average = 45 / 5 = 9 minutes.
    You have 4 people ahead and 1 counter open -> 4 x 9 / 1 = 36 minutes.
    Open a second counter -> 4 x 9 / 2 = 18 minutes.

Limitations (worth saying out loud in an interview): it assumes counters work
in parallel at the same speed, ignores staff breaks, and treats every customer
of a given service as identical.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Counter, QueueToken, Service, ServiceHistory

RECENT_SAMPLE_SIZE = 20
MIN_SAMPLES = 3


def average_service_minutes(db: Session, service: Service) -> float:
    """Mean duration of the most recent completed services, in minutes."""
    recent = db.execute(
        select(ServiceHistory.service_duration)
        .where(ServiceHistory.service_id == service.id)
        .order_by(ServiceHistory.completed_at.desc())
        .limit(RECENT_SAMPLE_SIZE)
    ).scalars().all()

    if len(recent) < MIN_SAMPLES:
        return float(service.average_duration)

    return round(sum(recent) / len(recent) / 60, 2)


def open_counter_count(db: Session) -> int:
    """Counters that can actually take customers. Never returns 0."""
    count = db.scalar(
        select(func.count(Counter.id)).where(Counter.status.in_(("AVAILABLE", "SERVING")))
    )
    return max(int(count or 0), 1)


def people_waiting(db: Session, service_id: int) -> int:
    return int(
        db.scalar(
            select(func.count(QueueToken.id)).where(
                QueueToken.service_id == service_id,
                QueueToken.status == "WAITING",
            )
        )
        or 0
    )


def people_ahead_of(db: Session, token: QueueToken) -> int:
    """How many waiting tokens for the same service would be called first.

    This uses exactly the same ordering rule as the queue itself: higher
    priority first, then earlier arrival. Keeping the two in sync is what makes
    the position shown to the customer trustworthy.
    """
    if token.status != "WAITING":
        return 0

    return int(
        db.scalar(
            select(func.count(QueueToken.id)).where(
                QueueToken.service_id == token.service_id,
                QueueToken.status == "WAITING",
                # A token is "ahead" if it has higher priority, or the same
                # priority and an earlier creation time.
                (QueueToken.priority > token.priority)
                | (
                    (QueueToken.priority == token.priority)
                    & (QueueToken.created_at < token.created_at)
                ),
            )
        )
        or 0
    )


def estimate_wait_minutes(db: Session, service: Service, people_ahead: int) -> int:
    """Turn a queue position into a minute estimate (rounded up to a minute)."""
    avg = average_service_minutes(db, service)
    counters = open_counter_count(db)
    minutes = (people_ahead * avg) / counters
    return int(round(minutes))
