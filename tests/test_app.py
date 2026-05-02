"""
Tests for app.py Flask routes.

`app.py` reads the port from `sys.argv[1]` at import time to populate
`app_config`, so we set sys.argv before importing.
"""
import sys
import os

import pytest

sys.argv = ["app.py", "5000"]

# Make the project root importable so `import app` resolves app.py at the repo root.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app  # noqa: E402


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def test_example_returns_json_string(client):
    response = client.get("/example")
    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload, str)
    assert payload.startswith("Example response from Flask")


def test_example_returns_json_content_type(client):
    response = client.get("/example")
    assert response.content_type == "application/json"


def test_unknown_route_returns_404(client):
    response = client.get("/this-does-not-exist")
    assert response.status_code == 404


def test_cors_headers_present_for_localhost_origin(client):
    response = client.get("/example", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"


def test_cors_headers_present_for_127_0_0_1_origin(client):
    response = client.get("/example", headers={"Origin": "http://127.0.0.1:3000"})
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "http://127.0.0.1:3000"


def test_cors_blocks_disallowed_origin(client):
    response = client.get("/example", headers={"Origin": "https://evil.example"})
    # Request still succeeds at HTTP level; the browser is what enforces CORS
    # by reading (or not reading) Access-Control-Allow-Origin. We assert the
    # disallowed origin is NOT echoed back, which is the security-relevant bit.
    assert response.headers.get("Access-Control-Allow-Origin") != "https://evil.example"


def test_quit_route_acknowledges(client, monkeypatch):
    """The /quit handler schedules os._exit on a Timer thread. Patch both
    so the test process is not killed and we can assert the schedule was set."""
    scheduled = {}

    class FakeTimer:
        def __init__(self, interval, fn):
            scheduled["interval"] = interval
            scheduled["fn"] = fn

        def start(self):
            scheduled["started"] = True

    monkeypatch.setattr("app.threading.Timer", FakeTimer)

    response = client.get("/quit")
    assert response.status_code == 200
    assert response.get_json() == {"status": "shutting down"}
    assert scheduled.get("started") is True
    assert scheduled.get("interval") == 0.1
