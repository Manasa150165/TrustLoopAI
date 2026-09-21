from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analyze_python_code_detects_divide_by_zero():
    payload = {
        "language": "python",
        "code": "def divide(a, b):\n    return a / b\n\nprint(divide(10, 0))\n",
        "requirements": "The code should handle invalid division by zero safely.",
    }

    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200

    body = response.json()
    assert body["language"] == "python"
    assert body["status"] in {"success", "warning"}
    assert any(item["category"] == "logic" for item in body["findings"])
    assert any("divide" in item["title"].lower() or "zero" in item["description"].lower() for item in body["findings"])


def test_analyze_rejects_empty_code():
    response = client.post(
        "/api/analyze",
        json={"language": "python", "code": "   ", "requirements": ""},
    )
    assert response.status_code == 422
