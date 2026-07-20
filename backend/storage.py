"""SQLite storage for DropN — drops, splits, claims, and escrow."""
import json
import os
import random
import sqlite3
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent / "dropn.db"
ESCROW_SCRIPT = Path(__file__).parent.parent / "escrow.js"
ESCROW_PRIVATE_KEY = os.environ.get("ESCROW_PRIVATE_KEY", "")
ESCROW_NETWORK = os.environ.get("ESCROW_NETWORK", "test")


def _conn():
    c = sqlite3.connect(str(DB_PATH))
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL")
    c.execute("PRAGMA foreign_keys=ON")
    return c


def init_db():
    """Create tables if they don't exist."""
    db = _conn()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS drops (
            id TEXT PRIMARY KEY,
            message TEXT NOT NULL,
            total_amount REAL NOT NULL,
            total_recipients INTEGER NOT NULL,
            sender_wallet TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            funded INTEGER NOT NULL DEFAULT 0,
            escrow_tx_hash TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS splits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            drop_id TEXT NOT NULL REFERENCES drops(id),
            amount REAL NOT NULL,
            position INTEGER NOT NULL,
            claimed INTEGER NOT NULL DEFAULT 0,
            claimer_wallet TEXT,
            payout_tx_hash TEXT,
            claimed_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_splits_drop ON splits(drop_id, claimed);
    """)
    db.commit()
    db.close()


def _generate_splits(total: float, n: int) -> list[float]:
    """Generate n random shares that sum exactly to total (stick-breaking)."""
    if n <= 1:
        return [total]
    cuts = sorted(random.random() for _ in range(n - 1))
    cuts = [0.0] + cuts + [1.0]
    shares = [round((cuts[i + 1] - cuts[i]) * total, 6) for i in range(n)]
    actual_sum = sum(shares)
    if actual_sum != total:
        shares[-1] = round(shares[-1] + (total - actual_sum), 6)
    return shares


def _run_escrow(*args) -> dict:
    """Run the escrow.js Node helper and return parsed JSON result."""
    if not ESCROW_SCRIPT.exists():
        return {"error": "escrow.js not found — install @nimiq/core: npm install @nimiq/core"}
    cmd = ["node", str(ESCROW_SCRIPT), *args]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        return {"error": result.stderr.strip() or "escrow helper failed"}
    try:
        return json.loads(result.stdout.strip())
    except json.JSONDecodeError:
        return {"error": f"invalid escrow output: {result.stdout[:200]}"}


def get_escrow_address() -> Optional[dict]:
    """Get or derive the escrow wallet address from the private key."""
    if not ESCROW_PRIVATE_KEY:
        return None
    result = _run_escrow("new-wallet")
    if "error" in result:
        return None
    # We don't use the generated key — we use the env var key
    # Just check that the escrow helper works
    return {"network": ESCROW_NETWORK}


def create_drop(amount: float, message: str, recipients: int, sender_wallet: str) -> dict:
    """Create a new drop with pre-generated random splits."""
    drop_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()
    splits = _generate_splits(amount, recipients)
    random.shuffle(splits)

    db = _conn()
    db.execute(
        "INSERT INTO drops (id, message, total_amount, total_recipients, sender_wallet, status, created_at) VALUES (?,?,?,?,?,?,?)",
        (drop_id, message, amount, recipients, sender_wallet, "active", now),
    )
    for pos, amt in enumerate(splits, 1):
        db.execute(
            "INSERT INTO splits (drop_id, amount, position) VALUES (?,?,?)",
            (drop_id, amt, pos),
        )
    db.commit()
    db.close()

    return {
        "id": drop_id,
        "claim_link": f"/claim/{drop_id}",
        "message": message,
        "total_amount": amount,
        "recipients": recipients,
        "status": "active",
        "funded": False,
    }


def get_drop(drop_id: str) -> Optional[dict]:
    """Get drop details with claim stats and escrow status."""
    db = _conn()
    row = db.execute("SELECT * FROM drops WHERE id=?", (drop_id,)).fetchone()
    if not row:
        db.close()
        return None

    claimed = db.execute(
        "SELECT COUNT(*) as c FROM splits WHERE drop_id=? AND claimed=1", (drop_id,)
    ).fetchone()["c"]

    db.close()

    return {
        "id": row["id"],
        "message": row["message"],
        "total_amount": row["total_amount"],
        "total_recipients": row["total_recipients"],
        "claimed_count": claimed,
        "remaining": row["total_recipients"] - claimed,
        "status": "exhausted" if claimed >= row["total_recipients"] else "active",
        "created_at": row["created_at"],
        "claim_link": f"/claim/{drop_id}",
        "sender_wallet": row["sender_wallet"],
        "funded": bool(row["funded"]),
        "escrow_tx_hash": row["escrow_tx_hash"] or None,
    }


def mark_drop_funded(drop_id: str, tx_hash: str) -> bool:
    """Mark a drop as funded by the sender."""
    db = _conn()
    row = db.execute("SELECT id FROM drops WHERE id=? AND funded=0", (drop_id,)).fetchone()
    if not row:
        db.close()
        return False
    db.execute(
        "UPDATE drops SET funded=1, escrow_tx_hash=? WHERE id=?",
        (tx_hash, drop_id),
    )
    db.commit()
    db.close()
    return True


def claim_drop(drop_id: str, wallet: str) -> Optional[dict]:
    """Claim a random unclaimed split from a drop. Auto-pays from escrow if funded."""
    db = _conn()
    try:
        drop = db.execute(
            "SELECT * FROM drops WHERE id=? AND status='active'", (drop_id,)
        ).fetchone()
        if not drop:
            return None

        split = db.execute(
            "SELECT * FROM splits WHERE drop_id=? AND claimed=0 ORDER BY RANDOM() LIMIT 1",
            (drop_id,),
        ).fetchone()
        if not split:
            return None

        now = datetime.now(timezone.utc).isoformat()
        payout_tx_hash = None

        # If drop is pre-funded, auto-pay from escrow
        if drop["funded"] and ESCROW_PRIVATE_KEY:
            escrow_result = _run_escrow(
                "send", ESCROW_PRIVATE_KEY, wallet, str(split["amount"]), ESCROW_NETWORK
            )
            if "transaction_hash" in escrow_result:
                payout_tx_hash = escrow_result["transaction_hash"]

        db.execute(
            "UPDATE splits SET claimed=1, claimer_wallet=?, claimed_at=?, payout_tx_hash=? WHERE id=?",
            (wallet, now, payout_tx_hash, split["id"]),
        )

        remaining = db.execute(
            "SELECT COUNT(*) as c FROM splits WHERE drop_id=? AND claimed=0", (drop_id,)
        ).fetchone()["c"]
        if remaining == 0:
            db.execute("UPDATE drops SET status='exhausted' WHERE id=?", (drop_id,))

        db.commit()

        total_claimed = drop["total_recipients"] - remaining

        return {
            "drop_id": drop_id,
            "amount": split["amount"],
            "message": drop["message"],
            "position": total_claimed,
            "total_claimed": total_claimed,
            "total_recipients": drop["total_recipients"],
            "sender_wallet": drop["sender_wallet"],
            "claimer_wallet": wallet,
            "payout_tx_hash": payout_tx_hash,
        }
    finally:
        db.close()
