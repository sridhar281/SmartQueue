from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Service(Base):
    """Something a customer can queue for, e.g. "Document Verification".

    average_duration is the fallback estimate in minutes. Once real service
    history exists, the waiting-time service prefers the measured average.
    """

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    average_duration: Mapped[int] = mapped_column(Integer, default=10)  # minutes
    # Services are deactivated, not deleted, so old tokens keep a valid FK.
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
