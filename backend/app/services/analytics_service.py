"""Analytics built from plain SQL aggregates (COUNT / AVG / GROUP BY).

Every number here comes from the database, not from in-memory counters, so the
dashboard is correct even after a restart.
"""

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import Float, cast, func, select
from sqlalchemy.orm import Session

from app.models import Counter, QueueToken, Service, ServiceHistory
from app.schemas.analytics import CounterStat, HourlyPoint, OverviewStats, ServiceStat


def _day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    return start, start + timedelta(days=1)


def overview(db: Session, day: date | None = None) -> OverviewStats:
    day = day or datetime.now(timezone.utc).date()
    start, end = _day_bounds(day)

    def count_tokens(*conditions) -> int:
        return int(db.scalar(select(func.count(QueueToken.id)).where(*conditions)) or 0)

    today = (QueueToken.created_at >= start, QueueToken.created_at < end)

    # Averages come from service_history, where durations are already measured.
    avg_wait, avg_service = db.execute(
        select(
            func.avg(cast(ServiceHistory.waiting_duration, Float)),
            func.avg(cast(ServiceHistory.service_duration, Float)),
        ).where(ServiceHistory.completed_at >= start, ServiceHistory.completed_at < end)
    ).one()

    # Peak hour: group today's tokens by hour and take the busiest bucket.
    peak = db.execute(
        select(func.date_part("hour", QueueToken.created_at).label("h"), func.count(QueueToken.id))
        .where(*today)
        .group_by("h")
        .order_by(func.count(QueueToken.id).desc())
        .limit(1)
    ).first()

    return OverviewStats(
        tokens_today=count_tokens(*today),
        waiting_now=count_tokens(QueueToken.status == "WAITING"),
        serving_now=count_tokens(QueueToken.status.in_(("CALLED", "SERVING"))),
        completed_today=count_tokens(*today, QueueToken.status == "COMPLETED"),
        cancelled_today=count_tokens(*today, QueueToken.status == "CANCELLED"),
        avg_waiting_minutes=round((avg_wait or 0) / 60, 1),
        avg_service_minutes=round((avg_service or 0) / 60, 1),
        active_counters=int(
            db.scalar(select(func.count(Counter.id)).where(Counter.status.in_(("AVAILABLE", "SERVING"))))
            or 0
        ),
        peak_hour=f"{int(peak[0]):02d}:00" if peak else None,
    )


def hourly(db: Session, day: date | None = None) -> list[HourlyPoint]:
    """Tokens created per hour, with the average wait of the ones completed."""
    day = day or datetime.now(timezone.utc).date()
    start, end = _day_bounds(day)

    tokens_by_hour = dict(
        db.execute(
            select(func.date_part("hour", QueueToken.created_at), func.count(QueueToken.id))
            .where(QueueToken.created_at >= start, QueueToken.created_at < end)
            .group_by(func.date_part("hour", QueueToken.created_at))
        ).all()
    )
    wait_by_hour = dict(
        db.execute(
            select(
                func.date_part("hour", ServiceHistory.completed_at),
                func.avg(cast(ServiceHistory.waiting_duration, Float)),
            )
            .where(ServiceHistory.completed_at >= start, ServiceHistory.completed_at < end)
            .group_by(func.date_part("hour", ServiceHistory.completed_at))
        ).all()
    )

    # Business hours only - a 24-bar chart of mostly zeros helps nobody.
    return [
        HourlyPoint(
            hour=f"{h:02d}:00",
            tokens=int(tokens_by_hour.get(h, 0)),
            avg_wait_minutes=round((wait_by_hour.get(h) or 0) / 60, 1),
        )
        for h in range(8, 21)
    ]


def service_stats(db: Session, days: int = 7) -> list[ServiceStat]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = db.execute(
        select(
            Service.id,
            Service.name,
            func.count(ServiceHistory.id),
            func.avg(cast(ServiceHistory.service_duration, Float)),
            func.avg(cast(ServiceHistory.waiting_duration, Float)),
        )
        .join(ServiceHistory, ServiceHistory.service_id == Service.id, isouter=True)
        .where((ServiceHistory.completed_at >= since) | (ServiceHistory.id.is_(None)))
        .group_by(Service.id, Service.name)
        .order_by(func.count(ServiceHistory.id).desc())
    ).all()

    return [
        ServiceStat(
            service_id=r[0],
            service_name=r[1],
            completed=int(r[2] or 0),
            avg_service_minutes=round((r[3] or 0) / 60, 1),
            avg_wait_minutes=round((r[4] or 0) / 60, 1),
        )
        for r in rows
    ]


def counter_stats(db: Session, days: int = 1) -> list[CounterStat]:
    """Utilisation = busy minutes / minutes in an 8-hour shift."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    shift_minutes = 8 * 60 * days

    rows = db.execute(
        select(
            Counter.id,
            Counter.name,
            func.count(ServiceHistory.id),
            func.sum(cast(ServiceHistory.service_duration, Float)),
        )
        .join(
            ServiceHistory,
            (ServiceHistory.counter_id == Counter.id) & (ServiceHistory.completed_at >= since),
            isouter=True,
        )
        .group_by(Counter.id, Counter.name)
        .order_by(Counter.name)
    ).all()

    stats = []
    for counter_id, name, served, busy_seconds in rows:
        busy_minutes = round((busy_seconds or 0) / 60, 1)
        stats.append(
            CounterStat(
                counter_id=counter_id,
                counter_name=name,
                served=int(served or 0),
                busy_minutes=busy_minutes,
                utilisation_percent=round(min(busy_minutes / shift_minutes * 100, 100), 1),
            )
        )
    return stats
