"""All queue rules live here so the API layer stays thin.

THE ORDERING RULE
-----------------
    ORDER BY priority DESC, created_at ASC

Higher priority first; ties broken by whoever arrived first. That is the whole
algorithm. Priority is 0 (normal) or 1 (appointment check-in, senior citizen),
which is enough to be interesting without becoming unpredictable for customers.

THE CONCURRENCY PROBLEM
-----------------------
Two admins at two counters press "Call next" at the same moment. Both run
"SELECT the first waiting token", both get SQ-104, both mark it CALLED, and one
customer is summoned to two counters while SQ-105 is silently skipped.

The fix is a database-level lock, not application-level cleverness:

    SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1

- FOR UPDATE locks the selected row until the transaction commits, so the second
  transaction cannot read-then-write the same row.
- SKIP LOCKED tells the second transaction to ignore the locked row and take the
  next one instead of blocking. So admin A gets SQ-104, admin B gets SQ-105, and
  neither waits. This is exactly the pattern PostgreSQL job queues use.

The lock is held for the few milliseconds between SELECT and COMMIT.
"""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Counter, QueueToken, Service
from app.services import waiting_time_service


class QueueError(Exception):
    """Raised for rule violations the customer/admin should see as a message."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _now() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------
# Token creation
# --------------------------------------------------------------------------

def generate_token_number(db: Session) -> str:
    """Produce the next human-friendly token number, e.g. SQ-104.

    Counting rows is not safe on its own under concurrency (two requests could
    read the same count), so token_number also carries a UNIQUE constraint in
    the database. If two inserts ever collide, the second raises and we retry.
    """
    last = db.scalar(select(func.max(QueueToken.id))) or 0
    return f"SQ-{100 + last + 1}"


def create_token(db: Session, user_id: int, service_id: int, priority: int = 0) -> QueueToken:
    service = db.get(Service, service_id)
    if service is None or not service.active:
        raise QueueError("This service is not available right now.", 404)

    # One active token per customer keeps the queue honest.
    existing = db.scalar(
        select(QueueToken).where(
            QueueToken.user_id == user_id,
            QueueToken.status.in_(("WAITING", "CALLED", "SERVING")),
        )
    )
    if existing is not None:
        raise QueueError(f"You already hold an active token ({existing.token_number}).", 409)

    token = QueueToken(
        token_number=generate_token_number(db),
        user_id=user_id,
        service_id=service_id,
        priority=priority,
        status="WAITING",
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


# --------------------------------------------------------------------------
# Call next  (the important one)
# --------------------------------------------------------------------------

def call_next(db: Session, counter_id: int, service_id: int | None = None) -> QueueToken:
    """Assign the next eligible waiting token to a counter.

    Runs inside one transaction: lock the row, update it, commit.
    """
    counter = db.get(Counter, counter_id)
    if counter is None:
        raise QueueError("Counter not found.", 404)
    if counter.status == "OFFLINE":
        raise QueueError("Open the counter before calling a customer.", 409)

    # Refuse if this counter is still holding someone.
    busy = db.scalar(
        select(QueueToken).where(
            QueueToken.counter_id == counter_id,
            QueueToken.status.in_(("CALLED", "SERVING")),
        )
    )
    if busy is not None:
        raise QueueError(
            f"{counter.name} is still serving {busy.token_number}. Complete or skip it first.",
            409,
        )

    query = (
        select(QueueToken)
        .where(QueueToken.status == "WAITING")
        .order_by(QueueToken.priority.desc(), QueueToken.created_at.asc())
        .limit(1)
        .with_for_update(skip_locked=True)  # <- the concurrency fix
    )
    if service_id is not None:
        query = query.where(QueueToken.service_id == service_id)

    token = db.scalar(query)
    if token is None:
        raise QueueError("No one is waiting.", 404)

    token.status = "CALLED"
    token.counter_id = counter_id
    token.called_at = _now()
    counter.status = "SERVING"

    db.commit()  # lock released here
    db.refresh(token)
    return token


def start_serving(db: Session, token_id: int) -> QueueToken:
    """Mark that the customer actually reached the counter."""
    token = db.get(QueueToken, token_id)
    if token is None:
        raise QueueError("Token not found.", 404)
    if token.status != "CALLED":
        raise QueueError(f"Token {token.token_number} is {token.status}, not CALLED.", 409)

    token.status = "SERVING"
    token.started_at = _now()
    db.commit()
    db.refresh(token)
    return token


# --------------------------------------------------------------------------
# Complete / skip / cancel
# --------------------------------------------------------------------------

def complete_service(db: Session, token_id: int):
    """Finish a service and write the row that trains future estimates."""
    from app.models import ServiceHistory  # local import keeps module graph flat

    token = db.get(QueueToken, token_id)
    if token is None:
        raise QueueError("Token not found.", 404)
    if token.status not in ("CALLED", "SERVING"):
        raise QueueError(f"Token {token.token_number} is not being served.", 409)

    now = _now()
    # If the admin never pressed "Start", treat the call time as the start.
    started = token.started_at or token.called_at or now
    called = token.called_at or now

    token.status = "COMPLETED"
    token.started_at = started
    token.completed_at = now

    history = ServiceHistory(
        token_id=token.id,
        service_id=token.service_id,
        counter_id=token.counter_id,
        # How long the counter was busy with this customer.
        service_duration=max(int((now - started).total_seconds()), 1),
        # How long the customer waited from joining the queue to being called.
        waiting_duration=max(int((called - token.created_at).total_seconds()), 0),
    )
    db.add(history)

    if token.counter_id:
        counter = db.get(Counter, token.counter_id)
        if counter and counter.status == "SERVING":
            counter.status = "AVAILABLE"

    db.commit()
    db.refresh(token)
    return token


def skip_token(db: Session, token_id: int, reason: str | None = None) -> QueueToken:
    """Customer did not turn up. The record is kept, never deleted."""
    token = db.get(QueueToken, token_id)
    if token is None:
        raise QueueError("Token not found.", 404)
    if token.status not in ("WAITING", "CALLED", "SERVING"):
        raise QueueError(f"Token {token.token_number} is already {token.status}.", 409)

    token.status = "SKIPPED"
    token.skip_reason = reason
    token.completed_at = _now()

    if token.counter_id:
        counter = db.get(Counter, token.counter_id)
        if counter and counter.status == "SERVING":
            counter.status = "AVAILABLE"

    db.commit()
    db.refresh(token)
    return token


def cancel_token(db: Session, token_id: int, user_id: int, is_admin: bool) -> QueueToken:
    token = db.get(QueueToken, token_id)
    if token is None:
        raise QueueError("Token not found.", 404)
    # Ownership check: a customer may only cancel their own token.
    if not is_admin and token.user_id != user_id:
        raise QueueError("This token belongs to someone else.", 403)
    if token.status != "WAITING":
        raise QueueError("Only a waiting token can be cancelled.", 409)

    token.status = "CANCELLED"
    token.completed_at = _now()
    db.commit()
    db.refresh(token)
    return token


# --------------------------------------------------------------------------
# Reads
# --------------------------------------------------------------------------

def active_token_for_user(db: Session, user_id: int) -> QueueToken | None:
    return db.scalar(
        select(QueueToken)
        .where(QueueToken.user_id == user_id, QueueToken.status.in_(("WAITING", "CALLED", "SERVING")))
        .order_by(QueueToken.created_at.desc())
    )


def now_serving(db: Session, service_id: int | None = None) -> str | None:
    query = (
        select(QueueToken.token_number)
        .where(QueueToken.status.in_(("CALLED", "SERVING")))
        .order_by(QueueToken.called_at.desc())
        .limit(1)
    )
    if service_id is not None:
        query = query.where(QueueToken.service_id == service_id)
    return db.scalar(query)


def token_detail(db: Session, token: QueueToken) -> dict:
    """Assemble everything the live status screen shows."""
    ahead = waiting_time_service.people_ahead_of(db, token)
    service = db.get(Service, token.service_id)
    counter = db.get(Counter, token.counter_id) if token.counter_id else None

    return {
        **{c.name: getattr(token, c.name) for c in token.__table__.columns},
        "service_name": service.name if service else "",
        "customer_name": token.user.name if token.user else "",
        "counter_name": counter.name if counter else None,
        "people_ahead": ahead,
        "estimated_wait_minutes": waiting_time_service.estimate_wait_minutes(db, service, ahead),
        "now_serving": now_serving(db, token.service_id),
    }


def waiting_list(db: Session, service_id: int | None = None, limit: int = 50) -> list[QueueToken]:
    """The queue in the exact order customers will be called."""
    query = (
        select(QueueToken)
        .where(QueueToken.status.in_(("WAITING", "CALLED", "SERVING")))
        .order_by(QueueToken.priority.desc(), QueueToken.created_at.asc())
        .limit(limit)
    )
    if service_id is not None:
        query = query.where(QueueToken.service_id == service_id)
    return list(db.scalars(query).all())
