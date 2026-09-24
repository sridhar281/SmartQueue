from tests.conftest import auth_header


def test_register_creates_customer(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "New User", "email": "new@test.dev", "password": "password123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["role"] == "customer"
    assert "access_token" in body


def test_register_never_creates_an_admin(client):
    """Even if the client sends role=admin, the server ignores it."""
    client.post(
        "/api/auth/register",
        json={"name": "Sneaky", "email": "sneaky@test.dev", "password": "password123", "role": "admin"},
    )
    me = client.get("/api/auth/me", headers=auth_header(client, "sneaky@test.dev", "password123"))
    assert me.json()["role"] == "customer"


def test_duplicate_email_rejected(client):
    payload = {"name": "A", "email": "dup@test.dev", "password": "password123"}
    client.post("/api/auth/register", json=payload)
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_login_with_wrong_password_fails(client, customer):
    response = client.post("/api/auth/login", json={"email": "cust@test.dev", "password": "wrong"})
    assert response.status_code == 401
    assert response.json()["success"] is False


def test_password_is_hashed(db_session, customer):
    assert customer.password_hash != "cust12345"
    assert customer.password_hash.startswith("$2")
