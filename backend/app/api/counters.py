from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models import Counter, QueueToken
from app.models.counter import COUNTER_STATUSES
from app.schemas.counter import CounterCreate, CounterOut, CounterUpdate, CounterWithToken
from app.websocket.manager import broadcast_queue_update

router = APIRouter(prefix="/api/admin/counters", tags=["counters"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[CounterWithToken])
def list_counters(db: Session = Depends(get_db)):
    counters = db.scalars(select(Counter).order_by(Counter.name)).all()

    result = []
    for counter in counters:
        token = db.scalar(
            select(QueueToken).where(
                QueueToken.counter_id == counter.id,
                QueueToken.status.in_(("CALLED", "SERVING")),
            )
        )
        result.append(
            CounterWithToken(
                **CounterOut.model_validate(counter).model_dump(),
                current_token=token.token_number if token else None,
                current_customer=token.user.name if token else None,
                current_service=token.service.name if token else None,
            )
        )
    return result


@router.post("", response_model=CounterOut, status_code=201)
def create_counter(payload: CounterCreate, db: Session = Depends(get_db)):
    if payload.status not in COUNTER_STATUSES:
        raise HTTPException(422, f"Status must be one of {', '.join(COUNTER_STATUSES)}.")
    if db.scalar(select(Counter).where(Counter.name == payload.name)):
        raise HTTPException(409, "A counter with this name already exists.")

    counter = Counter(**payload.model_dump())
    db.add(counter)
    db.commit()
    db.refresh(counter)
    return counter


@router.patch("/{counter_id}", response_model=CounterOut)
async def update_counter(counter_id: int, payload: CounterUpdate, db: Session = Depends(get_db)):
    counter = db.get(Counter, counter_id)
    if counter is None:
        raise HTTPException(404, "Counter not found.")
    if payload.status and payload.status not in COUNTER_STATUSES:
        raise HTTPException(422, f"Status must be one of {', '.join(COUNTER_STATUSES)}.")

    # Closing a counter that is mid-service would strand the customer.
    if payload.status == "OFFLINE":
        busy = db.scalar(
            select(QueueToken).where(
                QueueToken.counter_id == counter_id,
                QueueToken.status.in_(("CALLED", "SERVING")),
            )
        )
        if busy:
            raise HTTPException(409, f"Finish serving {busy.token_number} before closing this counter.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(counter, field, value)
    db.commit()
    db.refresh(counter)

    # Counter count changes every customer's estimate, so tell everyone.
    await broadcast_queue_update("counter_updated", {"counter_id": counter.id, "status": counter.status})
    return counter
