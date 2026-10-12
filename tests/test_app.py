"""Basic signup tests for the extracurricular activities API."""

import copy

import pytest
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_signups():
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


client = TestClient(app)


def test_activities_are_available():
    response = client.get("/activities")
    assert response.status_code == 200
    assert "Chess Club" in response.json()


def test_signup_and_unregister():
    email = "new.student@example.edu"
    response = client.post("/activities/Chess Club/signup", params={"email": email})
    assert response.status_code == 200
    assert email in client.get("/activities").json()["Chess Club"]["participants"]

    removal = client.delete("/activities/Chess Club/signup", params={"email": email})
    assert removal.status_code == 200
    assert email not in client.get("/activities").json()["Chess Club"]["participants"]


def test_duplicate_signup_is_rejected():
    email = "new.student@example.edu"
    assert client.post("/activities/Chess Club/signup", params={"email": email}).status_code == 200
    duplicate = client.post("/activities/Chess Club/signup", params={"email": email})
    assert duplicate.status_code == 400


def test_unknown_activity_returns_404():
    response = client.post("/activities/Not a club/signup", params={"email": "any@example.edu"})
    assert response.status_code == 404


def test_unregister_missing_student_returns_404():
    response = client.delete("/activities/Chess Club/signup", params={"email": "missing@example.edu"})
    assert response.status_code == 404


def test_full_activity_rejects_signups():
    activities["Chess Club"]["max_participants"] = len(activities["Chess Club"]["participants"])
    response = client.post("/activities/Chess Club/signup", params={"email": "late@example.edu"})
    assert response.status_code == 400
