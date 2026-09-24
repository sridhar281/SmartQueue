from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ServiceHistory(Base):
    """A completed service, recorded once per finished token.

    This table is the memory of the system: waiting-time estimates and every
    analytics chart read from here instead of recomputing from raw tokens.
    Durations are stored in seconds so short services stay accurate.
    """

    __tablename__ = "service_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token_id: Mapped[int] = mapped_column(ForeignKey("queue_tokens.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    counter_id: Mapped[int | None] = mapped_column(ForeignKey("counters.id"), nullable=True)
    service_duration: Mapped[int] = mapped_column(Integer, nullable=False)  # seconds serving
    waiting_duration: Mapped[int] = mapped_column(Integer, nullable=False)  # seconds waiting
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        # Waiting-time estimation reads "last N rows for this service", and the
        # analytics endpoints group by service over a date range.
        Index("ix_history_service_completed", "service_id", "completed_at"),
    )
