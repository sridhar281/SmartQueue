from datetime import datetime, timedelta, timezone

from app.models import Counter, QueueToken, ServiceHistory
from app.services import waiting_time_service


def add_history(db, service_id, minutes):
    token = QueueToken(
        token_number=f"SQ-H{minutes}{id(minutes) % 1000}",
        user_id=1,
        service_id=service_id,
        status="COMPLETED",
    )
    db.add(token)
    db.flush()
    db.add(
        ServiceHistory(
            token_id=token.id,
            service_id=service_id,
            service_duration=minutes * 60,
            waiting_duration=600,
            completed_at=datetime.now(timezone.utc) - timedelta(minutes=minutes),
        )
    )
    db.commit()


def test_falls_back_to_configured_average_without_history(db_session, service):
    assert waiting_time_service.average_service_minutes(db_session, service) == 10.0


def test_uses_measured_average_once_history_exists(db_session, customer, service):
    for minutes in (8, 10, 7, 9, 11):  # average 9
        add_history(db_session, service.id, minutes)

    assert waiting_time_service.average_service_minutes(db_session, service) == 9.0


def test_estimate_multiplies_people_ahead_by_average(db_session, customer, service, counter):
    for minutes in (8, 10, 7, 9, 11):
        add_history(db_session, service.id, minutes)

    # 4 people ahead x 9 minutes / 1 open counter = 36
    assert waiting_time_service.estimate_wait_minutes(db_session, service, 4) == 36


def test_more_counters_reduce_the_estimate(db_session, customer, service, counter):
    for minutes in (8, 10, 7, 9, 11):
        add_history(db_session, service.id, minutes)
    db_session.add(Counter(name="Counter 2", status="AVAILABLE"))
    db_session.commit()

    # 4 x 9 / 2 counters = 18
    assert waiting_time_service.estimate_wait_minutes(db_session, service, 4) == 18
