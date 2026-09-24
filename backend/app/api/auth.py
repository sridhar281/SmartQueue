from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services.auth_service import AuthError, login, register

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = register(db, payload.name, payload.email, payload.password)
        _, token = login(db, payload.email, payload.password)
    except AuthError as exc:
        raise HTTPException(exc.status_code, exc.message)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user, token = login(db, payload.email, payload.password)
    except AuthError as exc:
        raise HTTPException(exc.status_code, exc.message)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    """Used by the frontend on page load to restore the session."""
    return user
