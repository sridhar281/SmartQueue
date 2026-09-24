from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

TOKEN_STATUSES = ("WAITING", "CALLED", "SERVING", "COMPLETED", "SKIPPED", "CANCELLED")
ACTIVE_STATUSES = ("WAITING", "CALLED", "SERVING")


class QueueToken(Base):
    """One customer's place in line, e.g. SQ-104."""

    __tablename__ = "queue_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    counter_id: Mapped[int | None] = mapped_column(ForeignKey("counters.id"), nullable=True)

    # 0 = normal, 1 = priority (senior citizen, appointment check-in, ...).
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="WAITING", nullable=False)
    skip_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    called_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user = relationship("User", back_populates="tokens")
    service = relationship("Service")
    counter = relationship("Counter")

    __table_args__ = (
        # The hottest query in the app is "next waiting token for this service,
        # ordered by priority then arrival". This composite index covers it.
        Index("ix_tokens_service_status_priority", "service_id", "status", "priority", "created_at"),
        # Dashboards filter by status ("how many are waiting right now?").
        Index("ix_tokens_status_created", "status", "created_at"),
        # "My tokens" lookups on the customer side.
        Index("ix_tokens_user_created", "user_id", "created_at"),
    )
