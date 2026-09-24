"""Customer-facing queue endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import QueueToken, User
from app.schemas.queue import TokenCreate, TokenDetail, TokenOut
from app.services import queue_service
from app.services.queue_service import QueueError
from app.websocket.manager import broadcast_queue_update

router = APIRouter(prefix="/api/queue", tags=["queue"])


@router.post("/tokens", response_model=TokenDetail, status_code=201)
async def take_token(
    payload: TokenCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        token = queue_service.create_token(db, user.id, payload.service_id, payload.priority)
    except QueueError as exc:
        raise HTTPException(exc.status_code, exc.message)

    detail = queue_service.token_detail(db, token)
    await broadcast_queue_update("token_created", detail)
    return detail


@router.get("/my-token", response_model=TokenDetail | None)
def my_token(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    token = queue_service.active_token_for_user(db, user.id)
    return queue_service.token_detail(db, token) if token else None


@router.get("/status", response_model=list[TokenOut])
def queue_status(service_id: int | None = None, db: Session = Depends(get_db)):
    """The public board: who is in line, in call order."""
    return queue_service.waiting_list(db, service_id)


@router.get("/history", response_model=list[TokenDetail])
def my_history(
    status: str | None = None,
    service_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = (
        select(QueueToken)
        .where(QueueToken.user_id == user.id)
        .order_by(QueueToken.created_at.desc())
        .limit(100)
    )
    if status:
        query = query.where(QueueToken.status == status)
    if service_id:
        query = query.where(QueueToken.service_id == service_id)
    return [queue_service.token_detail(db, t) for t in db.scalars(query).all()]


@router.post("/{token_id}/cancel", response_model=TokenOut)
async def cancel(token_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        token = queue_service.cancel_token(db, token_id, user.id, user.role == "admin")
    except QueueError as exc:
        raise HTTPException(exc.status_code, exc.message)

    await broadcast_queue_update(
        "token_cancelled",
        {"token_number": token.token_number, "service_id": token.service_id, "user_id": token.user_id},
    )
    return token
