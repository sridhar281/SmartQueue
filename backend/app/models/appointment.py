from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

APPOINTMENT_STATUSES = ("SCHEDULED", "CHECKED_IN", "COMPLETED", "CANCELLED", "MISSED")


class Appointment(Base):
    """A booked slot. On check-in it becomes a priority queue token."""

    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False)
    appointment_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="SCHEDULED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="appointments")
    service = relationship("Service")

    __table_args__ = (
        # "Today's schedule" for admins, and duplicate-slot checks on booking.
        Index("ix_appointments_date_service", "appointment_date", "service_id"),
        # "My appointments" for customers.
        Index("ix_appointments_user_date", "user_id", "appointment_date"),
    )
