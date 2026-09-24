from tests.conftest import auth_header


def test_customer_cannot_create_service(client, customer):
    response = client.post(
        "/api/services",
        json={"name": "Hacked", "description": "", "average_duration": 5},
        headers=auth_header(client, "cust@test.dev", "cust12345"),
    )
    assert response.status_code == 403


def test_admin_can_create_service(client, admin):
    response = client.post(
        "/api/services",
        json={"name": "New Service", "description": "", "average_duration": 5},
        headers=auth_header(client, "admin@test.dev", "admin12345"),
    )
    assert response.status_code == 201


def test_analytics_requires_authentication(client):
    assert client.get("/api/admin/analytics/overview").status_code == 401
