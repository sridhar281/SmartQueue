from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CounterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    status: str = "OFFLINE"


class CounterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=60)
    status: str | None = None


class CounterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    status: str
    created_at: datetime


class CounterWithToken(CounterOut):
    current_token: str | None = None
    current_customer: str | None = None
    current_service: str | None = None
