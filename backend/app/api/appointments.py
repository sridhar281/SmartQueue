from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Appointment, Service, User
from app.schemas.appointment import AppointmentCreate, AppointmentOut, AppointmentUpdate
from app.schemas.queue import TokenDetail
from app.services import queue_service
from app.services.queue_service import QueueError
from app.websocket.manager import broadcast_queue_update

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


def _serialise(appointment: Appointment) -> AppointmentOut:
    out = AppointmentOut.model_validate(appointment)
    out.service_name = appointment.service.name if appointment.service else None
    return out


@router.get("", response_model=list[AppointmentOut])
def list_appointments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = select(Appointment).order_by(
        Appointment.appointment_date.desc(), Appointment.appointment_time.desc()
    )
    # Customers only ever see their own bookings; admins see everything.
    if user.role != "admin":
        query = query.where(Appointment.user_id == user.id)
    return [_serialise(a) for a in db.scalars(query).all()]


@router.post("", response_model=AppointmentOut, status_code=201)
def book(payload: AppointmentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    service = db.get(Service, payload.service_id)
    if service is None or not service.active:
        raise HTTPException(404, "This service is not available right now.")
    if payload.appointment_date < date.today():
        raise HTTPException(422, "Choose a date in the future.")

    duplicate = db.scalar(
        select(Appointment).where(
            Appointment.user_id == user.id,
            Appointment.service_id == payload.service_id,
            Appointment.appointment_date == payload.appointment_date,
            Appointment.appointment_time == payload.appointment_time,
            Appointment.status == "SCHEDULED",
        )
    )
    if duplicate:
        raise HTTPException(409, "You already booked this slot.")

    appointment = Appointment(user_id=user.id, **payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return _serialise(appointment)


@router.patch("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(404, "Appointment not found.")
    if user.role != "admin" and appointment.user_id != user.id:
        raise HTTPException(403, "This appointment belongs to someone else.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return _serialise(appointment)


@router.post("/{appointment_id}/check-in", response_model=TokenDetail)
async def check_in(appointment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Turn a booking into a live token.

    Checked-in appointments get priority=1: the customer reserved a slot, so
    they should be called before walk-ins who arrived at the same moment.
    """
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(404, "Appointment not found.")
    if user.role != "admin" and appointment.user_id != user.id:
        raise HTTPException(403, "This appointment belongs to someone else.")
    if appointment.status != "SCHEDULED":
        raise HTTPException(409, f"This appointment is {appointment.status}.")
    if appointment.appointment_date != datetime.now(timezone.utc).date():
        raise HTTPException(409, "You can only check in on the day of the appointment.")

    try:
        token = queue_service.create_token(db, appointment.user_id, appointment.service_id, priority=1)
    except QueueError as exc:
        raise HTTPException(exc.status_code, exc.message)

    appointment.status = "CHECKED_IN"
    db.commit()

    detail = queue_service.token_detail(db, token)
    await broadcast_queue_update("token_created", detail)
    return detail
