from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TokenCreate(BaseModel):
    service_id: int
    priority: int = Field(default=0, ge=0, le=1)


class TokenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    token_number: str
    user_id: int
    service_id: int
    counter_id: int | None
    priority: int
    status: str
    created_at: datetime
    called_at: datetime | None
    started_at: datetime | None
    completed_at: datetime | None


class TokenDetail(TokenOut):
    """Everything the live status page needs in one response."""

    service_name: str
    customer_name: str
    counter_name: str | None = None
    people_ahead: int = 0
    estimated_wait_minutes: int = 0
    now_serving: str | None = None


class SkipRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=255)


class CallNextRequest(BaseModel):
    counter_id: int
    service_id: int | None = None  # None = call from any service
