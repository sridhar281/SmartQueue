"""Registration and login rules."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models import User


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def register(db: Session, name: str, email: str, password: str) -> User:
    email = email.lower().strip()
    if db.scalar(select(User).where(User.email == email)):
        raise AuthError("An account with this email already exists.", 409)

    # role is hard-coded to "customer": a self-service signup can never mint an
    # admin, no matter what the request body contains.
    user = User(name=name.strip(), email=email, password_hash=hash_password(password), role="customer")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(db: Session, email: str, password: str) -> tuple[User, str]:
    user = db.scalar(select(User).where(User.email == email.lower().strip()))
    # Same message for "no such user" and "wrong password" so the endpoint
    # cannot be used to discover which emails are registered.
    if user is None or not verify_password(password, user.password_hash):
        raise AuthError("Incorrect email or password.", 401)

    return user, create_access_token(user.id, user.role)
