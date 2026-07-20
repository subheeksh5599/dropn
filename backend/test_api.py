"""Tests for DropN backend — drops API."""
import pytest
from fastapi.testclient import TestClient

import backend.storage as storage

storage.DB_PATH = storage.Path(storage.Path(__file__).parent.parent / "backend" / "test_dropn.db")

# Re-init on test DB
storage.init_db()

from backend.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    """Wipe test DB between tests."""
    db = storage._conn()
    db.execute("DELETE FROM splits")
    db.execute("DELETE FROM drops")
    db.commit()
    db.close()
    yield


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "DropN"
    assert data["status"] == "online"


def test_create_drop():
    resp = client.post("/drops", json={
        "amount": 100.0,
        "message": "Test drop",
        "recipients": 5,
        "sender_wallet": "NQ12_TEST",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["total_amount"] == 100.0
    assert data["recipients"] == 5
    assert data["status"] == "active"
    assert "claim_link" in data


def test_create_drop_validation():
    resp = client.post("/drops", json={
        "amount": -1,
        "message": "",
        "recipients": 1,
        "sender_wallet": "",
    })
    assert resp.status_code == 422


def test_get_drop():
    create = client.post("/drops", json={
        "amount": 50.0,
        "message": "Hello",
        "recipients": 3,
        "sender_wallet": "NQ12_SENDER",
    })
    drop_id = create.json()["id"]

    resp = client.get(f"/drops/{drop_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == drop_id
    assert data["total_amount"] == 50.0
    assert data["claimed_count"] == 0
    assert data["remaining"] == 3
    assert data["status"] == "active"


def test_get_drop_404():
    resp = client.get("/drops/doesnotexist")
    assert resp.status_code == 404


def test_claim_drop():
    create = client.post("/drops", json={
        "amount": 100.0,
        "message": "Claim test",
        "recipients": 5,
        "sender_wallet": "NQ12_SENDER",
    })
    drop_id = create.json()["id"]

    resp = client.post(f"/drops/{drop_id}/claim", json={"wallet": "NQ12_CLAIMER"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["drop_id"] == drop_id
    assert data["amount"] > 0
    assert data["position"] == 1
    assert data["total_claimed"] == 1
    assert data["total_recipients"] == 5


def test_splits_sum_to_total():
    """All split amounts must sum to the total."""
    create = client.post("/drops", json={
        "amount": 100.0,
        "message": "Sum test",
        "recipients": 10,
        "sender_wallet": "NQ12_SENDER",
    })
    drop_id = create.json()["id"]

    # Claim all 10
    total_claimed = 0.0
    for i in range(10):
        resp = client.post(f"/drops/{drop_id}/claim", json={"wallet": f"NQ12_WALLET_{i}"})
        assert resp.status_code == 200
        total_claimed += resp.json()["amount"]

    assert abs(total_claimed - 100.0) < 0.01


def test_random_payouts_are_uneven():
    """Random splits should produce different amounts."""
    create = client.post("/drops", json={
        "amount": 100.0,
        "message": "Uneven test",
        "recipients": 5,
        "sender_wallet": "NQ12_SENDER",
    })
    drop_id = create.json()["id"]

    amounts = set()
    for i in range(5):
        resp = client.post(f"/drops/{drop_id}/claim", json={"wallet": f"NQ12_WALLET_{i}"})
        amounts.add(resp.json()["amount"])

    # With 5 splits from 100 NIM, at least 3 should be different
    assert len(amounts) >= 3, f"Got {len(amounts)} unique amounts, expected at least 3"


def test_drop_exhausted():
    create = client.post("/drops", json={
        "amount": 10.0,
        "message": "Exhaust test",
        "recipients": 2,
        "sender_wallet": "NQ12_SENDER",
    })
    drop_id = create.json()["id"]

    # Claim both
    client.post(f"/drops/{drop_id}/claim", json={"wallet": "NQ12_A"})
    client.post(f"/drops/{drop_id}/claim", json={"wallet": "NQ12_B"})

    # Drop should now be exhausted
    resp = client.post(f"/drops/{drop_id}/claim", json={"wallet": "NQ12_C"})
    assert resp.status_code == 400
    assert "fully claimed" in resp.json()["detail"].lower()


def test_drop_status_exhausted():
    create = client.post("/drops", json={
        "amount": 10.0,
        "message": "Status test",
        "recipients": 2,
        "sender_wallet": "NQ12_SENDER",
    })
    drop_id = create.json()["id"]

    # Claim both
    client.post(f"/drops/{drop_id}/claim", json={"wallet": "NQ12_A"})
    client.post(f"/drops/{drop_id}/claim", json={"wallet": "NQ12_B"})

    # Check status
    resp = client.get(f"/drops/{drop_id}")
    assert resp.json()["status"] == "exhausted"


def test_claim_page_active():
    create = client.post("/drops", json={
        "amount": 20.0,
        "message": "Page test",
        "recipients": 3,
        "sender_wallet": "NQ12_SENDER",
    })
    drop_id = create.json()["id"]

    resp = client.get(f"/claim/{drop_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "active"
    assert data["message"] == "Page test"
    assert data["remaining"] == 3


def test_claim_page_exhausted():
    create = client.post("/drops", json={
        "amount": 5.0,
        "message": "Gone",
        "recipients": 2,
        "sender_wallet": "NQ12_SENDER",
    })
    drop_id = create.json()["id"]
    client.post(f"/drops/{drop_id}/claim", json={"wallet": "NQ12_A"})
    client.post(f"/drops/{drop_id}/claim", json={"wallet": "NQ12_B"})

    resp = client.get(f"/claim/{drop_id}")
    assert resp.json()["status"] == "exhausted"


def test_claim_page_404():
    resp = client.get("/claim/nonexistent")
    assert resp.status_code == 404
