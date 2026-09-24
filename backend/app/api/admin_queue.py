"""Admin queue control: call next, start, complete, skip."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.schemas.queue import CallNextRequest, SkipRequest, TokenDetail
from app.services import queue_service
from app.services.queue_service import QueueError
from app.websocket.manager import broadcast_queue_update

router = APIRouter(
    prefix="/api/admin/queue",
    tags=["admin-queue"],
    dependencies=[Depends(require_admin)],  # every route below is admin-only
)


@router.post("/next", response_model=TokenDetail)
async def call_next(payload: CallNextRequest, db: Session = Depends(get_db)):
    """Pick the next customer and assign them to a counter.

    Concurrency-safe: see the docstring in services/queue_service.py. Two
    admins pressing this at the same instant get two different tokens.
    """
    try:
        token = queue_service.call_next(db, payload.counter_id, payload.service_id)
    except QueueError as exc:
        raise HTTPException(exc.status_code, exc.message)

    detail = queue_service.token_detail(db, token)
    await broadcast_queue_update("token_called", detail)
    return detail


@router.post("/{token_id}/start", response_model=TokenDetail)
async def start(token_id: int, db: Session = Depends(get_db)):
    try:
        token = queue_service.start_serving(db, token_id)
    except QueueError as exc:
        raise HTTPException(exc.status_code, exc.message)

    detail = queue_service.token_detail(db, token)
    await broadcast_queue_update("token_serving", detail)
    return detail


@router.post("/{token_id}/complete", response_model=TokenDetail)
async def complete(token_id: int, db: Session = Depends(get_db)):
    try:
        token = queue_service.complete_service(db, token_id)
    except QueueError as exc:
        raise HTTPException(exc.status_code, exc.message)

    detail = queue_service.token_detail(db, token)
    # Everyone behind this customer just moved up, so the whole service room
    # needs to refresh its estimate.
    await broadcast_queue_update("token_completed", detail)
    return detail


@router.post("/{token_id}/skip", response_model=TokenDetail)
async def skip(token_id: int, payload: SkipRequest, db: Session = Depends(get_db)):
    try:
        token = queue_service.skip_token(db, token_id, payload.reason)
    except QueueError as exc:
        raise HTTPException(exc.status_code, exc.message)

    detail = queue_service.token_detail(db, token)
    await broadcast_queue_update("token_skipped", detail)
    return detail
