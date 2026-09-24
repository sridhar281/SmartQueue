from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = ""
    average_duration: int = Field(default=10, ge=1, le=240)  # minutes


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = None
    average_duration: int | None = Field(default=None, ge=1, le=240)
    active: bool | None = None


class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    average_duration: int
    active: bool
    created_at: datetime


class ServicePublic(ServiceOut):
    """What the customer sees on the service list."""

    waiting_count: int
    estimated_wait_minutes: int
    average_service_minutes: int
