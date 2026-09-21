from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_signup_and_login_flow():
    signup_payload = {
        "username": "alice",
        "email": "alice@example.com",
        "password": "secret123",
    }

    signup_response = client.post("/api/auth/signup", json=signup_payload)
    assert signup_response.status_code == 200, signup_response.text
    signup_body = signup_response.json()
    assert signup_body["user"]["email"] == "alice@example.com"
    assert "token" in signup_body

    login_response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "secret123"},
    )
    assert login_response.status_code == 200, login_response.text
    login_body = login_response.json()
    assert "token" in login_body

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login_body['token']}"},
    )
    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["email"] == "alice@example.com"
