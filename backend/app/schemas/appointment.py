from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict


class AppointmentCreate(BaseModel):
    service_id: int
    appointment_date: date
    appointment_time: time


class AppointmentUpdate(BaseModel):
    status: str | None = None
    appointment_date: date | None = None
    appointment_time: time | None = None


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    service_id: int
    service_name: str | None = None
    appointment_date: date
    appointment_time: time
    status: str
    created_at: datetime
