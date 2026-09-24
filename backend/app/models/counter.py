from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

COUNTER_STATUSES = ("AVAILABLE", "SERVING", "OFFLINE")


class Counter(Base):
    """A physical desk/window where a staff member serves customers."""

    __tablename__ = "counters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="OFFLINE", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
