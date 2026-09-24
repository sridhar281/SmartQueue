"""Two admins pressing "Call next" at the same instant must get different tokens.

This needs real PostgreSQL because SELECT ... FOR UPDATE SKIP LOCKED does not
exist on SQLite. Run it with:

    TEST_DATABASE_URL=postgresql+psycopg2://user:pass@localhost/smartqueue_test pytest
"""

import os
import threading
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.security import hash_password
from app.models import Counter, QueueToken, Service, User
from app.services import queue_service

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL, reason="Set TEST_DATABASE_URL to a PostgreSQL database to run this test."
)


def test_two_simultaneous_calls_get_different_tokens():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    setup = Session()
    user = User(name="C", email="c@test.dev", password_hash=hash_password("x" * 10))
    service = Service(name="S", average_duration=5)
    counters = [Counter(name="C1", status="AVAILABLE"), Counter(name="C2", status="AVAILABLE")]
    setup.add_all([user, service, *counters])
    setup.commit()

    now = datetime.now(timezone.utc)
    for i in range(2):
        setup.add(
            QueueToken(
                token_number=f"SQ-{200 + i}",
                user_id=user.id,
                service_id=service.id,
                status="WAITING",
                created_at=now - timedelta(minutes=10 - i),
            )
        )
    setup.commit()
    counter_ids = [c.id for c in counters]
    setup.close()

    results = []
    barrier = threading.Barrier(2)

    def call(counter_id):
        session = Session()
        try:
            barrier.wait()  # make both threads hit the SELECT together
            results.append(queue_service.call_next(session, counter_id).token_number)
        finally:
            session.close()

    threads = [threading.Thread(target=call, args=(cid,)) for cid in counter_ids]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(results) == 2
    assert len(set(results)) == 2, "Both admins were given the same token"
