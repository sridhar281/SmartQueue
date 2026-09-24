from datetime import datetime, timedelta, timezone

import pytest

from app.models import QueueToken, ServiceHistory
from app.services import queue_service, waiting_time_service
from app.services.queue_service import QueueError


def make_token(db, user_id, service_id, minutes_ago=0, priority=0):
    token = QueueToken(
        token_number=queue_service.generate_token_number(db),
        user_id=user_id,
        service_id=service_id,
        priority=priority,
        status="WAITING",
        created_at=datetime.now(timezone.utc) - timedelta(minutes=minutes_ago),
    )
    db.add(token)
    db.commit()
    return token


def test_token_created_with_waiting_status(db_session, customer, service):
    token = queue_service.create_token(db_session, customer.id, service.id)
    assert token.status == "WAITING"
    assert token.token_number.startswith("SQ-")


def test_one_active_token_per_customer(db_session, customer, service):
    queue_service.create_token(db_session, customer.id, service.id)
    with pytest.raises(QueueError):
        queue_service.create_token(db_session, customer.id, service.id)


def test_queue_is_ordered_by_arrival(db_session, customer, service, counter):
    first = make_token(db_session, customer.id, service.id, minutes_ago=10)
    make_token(db_session, customer.id, service.id, minutes_ago=5)

    called = queue_service.call_next(db_session, counter.id)
    assert called.id == first.id


def test_priority_beats_arrival_time(db_session, customer, service, counter):
    make_token(db_session, customer.id, service.id, minutes_ago=30)  # earlier, normal
    vip = make_token(db_session, customer.id, service.id, minutes_ago=1, priority=1)

    called = queue_service.call_next(db_session, counter.id)
    assert called.id == vip.id


def test_call_next_assigns_counter_and_marks_it_serving(db_session, customer, service, counter):
    make_token(db_session, customer.id, service.id)
    token = queue_service.call_next(db_session, counter.id)

    assert token.status == "CALLED"
    assert token.counter_id == counter.id
    assert token.called_at is not None
    db_session.refresh(counter)
    assert counter.status == "SERVING"


def test_call_next_on_empty_queue_raises(db_session, counter):
    with pytest.raises(QueueError):
        queue_service.call_next(db_session, counter.id)


def test_busy_counter_cannot_call_again(db_session, customer, service, counter):
    make_token(db_session, customer.id, service.id, minutes_ago=5)
    make_token(db_session, customer.id, service.id, minutes_ago=4)
    queue_service.call_next(db_session, counter.id)

    with pytest.raises(QueueError):
        queue_service.call_next(db_session, counter.id)


def test_complete_writes_service_history(db_session, customer, service, counter):
    make_token(db_session, customer.id, service.id, minutes_ago=20)
    token = queue_service.call_next(db_session, counter.id)
    queue_service.start_serving(db_session, token.id)
    completed = queue_service.complete_service(db_session, token.id)

    assert completed.status == "COMPLETED"
    history = db_session.query(ServiceHistory).filter_by(token_id=token.id).one()
    assert history.service_duration >= 1
    # Waited roughly 20 minutes before being called.
    assert history.waiting_duration > 60 * 19
    db_session.refresh(counter)
    assert counter.status == "AVAILABLE"


def test_skip_keeps_the_record(db_session, customer, service, counter):
    token = make_token(db_session, customer.id, service.id)
    skipped = queue_service.skip_token(db_session, token.id, reason="No response")

    assert skipped.status == "SKIPPED"
    assert skipped.skip_reason == "No response"
    assert db_session.get(QueueToken, token.id) is not None


def test_customer_cannot_cancel_someone_elses_token(db_session, customer, admin, service):
    token = make_token(db_session, customer.id, service.id)
    with pytest.raises(QueueError):
        queue_service.cancel_token(db_session, token.id, user_id=admin.id, is_admin=False)


def test_people_ahead_matches_call_order(db_session, customer, service):
    make_token(db_session, customer.id, service.id, minutes_ago=10)
    make_token(db_session, customer.id, service.id, minutes_ago=8)
    mine = make_token(db_session, customer.id, service.id, minutes_ago=2)

    assert waiting_time_service.people_ahead_of(db_session, mine) == 2
