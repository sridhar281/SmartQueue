"""Shared FastAPI dependencies: who is calling, and are they allowed?"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to continue.")

    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your session has expired. Sign in again.")

    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account no longer exists.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Authorisation check.

    The role is read from the DATABASE, not from the JWT payload and certainly
    not from anything the frontend sent. A stolen or edited token still cannot
    grant admin rights.
    """
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This area is for administrators.")
    return user
