"""SQLite storage for DropN — drops, splits, and claims."""
import json
import random
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent / "dropn.db"


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
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS splits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            drop_id TEXT NOT NULL REFERENCES drops(id),
            amount REAL NOT NULL,
            position INTEGER NOT NULL,
            claimed INTEGER NOT NULL DEFAULT 0,
            claimer_wallet TEXT,
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
    # Generate n-1 random cut points, then take differences
    cuts = sorted(random.random() for _ in range(n - 1))
    cuts = [0.0] + cuts + [1.0]
    # Shares proportional to gap sizes, then rounded
    shares = [round((cuts[i + 1] - cuts[i]) * total, 6) for i in range(n)]
    # Adjust the last share to fix any rounding error
    actual_sum = sum(shares)
    if actual_sum != total:
        shares[-1] = round(shares[-1] + (total - actual_sum), 6)
    return shares


def create_drop(amount: float, message: str, recipients: int, sender_wallet: str) -> dict:
    """Create a new drop with pre-generated random splits."""
    drop_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()
    splits = _generate_splits(amount, recipients)

    # Shuffle splits so claims are random order, not largest-first
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
    }


def get_drop(drop_id: str) -> Optional[dict]:
    """Get drop details with claim stats."""
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
    }


def claim_drop(drop_id: str, wallet: str) -> Optional[dict]:
    """Claim a random unclaimed split from a drop. Returns claim details or None."""
    db = _conn()
    try:
        # Verify drop exists and is active
        drop = db.execute(
            "SELECT * FROM drops WHERE id=? AND status='active'", (drop_id,)
        ).fetchone()
        if not drop:
            return None

        # Get one random unclaimed split
        split = db.execute(
            "SELECT * FROM splits WHERE drop_id=? AND claimed=0 ORDER BY RANDOM() LIMIT 1",
            (drop_id,),
        ).fetchone()
        if not split:
            return None

        now = datetime.now(timezone.utc).isoformat()
        db.execute(
            "UPDATE splits SET claimed=1, claimer_wallet=?, claimed_at=? WHERE id=?",
            (wallet, now, split["id"]),
        )

        # Check if drop is now exhausted
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
        }
    finally:
        db.close()
