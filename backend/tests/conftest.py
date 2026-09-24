"""Test fixtures.

Tests run against an in-memory SQLite database so they need no PostgreSQL
server. The one PostgreSQL-only feature we use (SELECT ... FOR UPDATE SKIP
LOCKED) degrades to a plain SELECT on SQLite, so the concurrency test is
marked to run only when a real PostgreSQL URL is provided via TEST_DATABASE_URL.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models import Counter, Service, User


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin(db_session):
    user = User(
        name="Admin", email="admin@test.dev", password_hash=hash_password("admin12345"), role="admin"
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture()
def customer(db_session):
    user = User(
        name="Cust", email="cust@test.dev", password_hash=hash_password("cust12345"), role="customer"
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture()
def service(db_session):
    s = Service(name="Document Verification", description="", average_duration=10)
    db_session.add(s)
    db_session.commit()
    return s


@pytest.fixture()
def counter(db_session):
    c = Counter(name="Counter 1", status="AVAILABLE")
    db_session.add(c)
    db_session.commit()
    return c


def auth_header(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
