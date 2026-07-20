"""In-memory storage for DropN — Vercel serverless (no disk writes)."""
import random
import uuid
from datetime import datetime, timezone
from typing import Optional

# In-memory store (shared across warm invocations)
_drops: dict = {}
_splits: dict = {}


def init_db():
    """No-op — in-memory, nothing to init."""
    pass


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


def create_drop(amount: float, message: str, recipients: int, sender_wallet: str) -> dict:
    """Create a new drop with pre-generated random splits."""
    drop_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()
    shares = _generate_splits(amount, recipients)
    random.shuffle(shares)

    _drops[drop_id] = {
        "id": drop_id,
        "message": message,
        "total_amount": amount,
        "total_recipients": recipients,
        "sender_wallet": sender_wallet,
        "status": "active",
        "created_at": now,
    }
    _splits[drop_id] = [{"amount": s, "claimed": False, "claimer_wallet": None} for s in shares]

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
    drop = _drops.get(drop_id)
    if not drop:
        return None
    split_list = _splits.get(drop_id, [])
    claimed = sum(1 for s in split_list if s["claimed"])
    return {
        "id": drop["id"],
        "message": drop["message"],
        "total_amount": drop["total_amount"],
        "total_recipients": drop["total_recipients"],
        "claimed_count": claimed,
        "remaining": drop["total_recipients"] - claimed,
        "status": "exhausted" if claimed >= drop["total_recipients"] else "active",
        "created_at": drop["created_at"],
        "claim_link": f"/claim/{drop_id}",
        "sender_wallet": drop["sender_wallet"],
    }


def claim_drop(drop_id: str, wallet: str) -> Optional[dict]:
    """Claim a random unclaimed split from a drop."""
    drop = _drops.get(drop_id)
    if not drop or drop["status"] != "active":
        return None

    split_list = _splits.get(drop_id, [])
    unclaimed = [s for s in split_list if not s["claimed"]]
    if not unclaimed:
        return None

    chosen = random.choice(unclaimed)
    chosen["claimed"] = True
    chosen["claimer_wallet"] = wallet

    total_claimed = sum(1 for s in split_list if s["claimed"])

    if total_claimed >= drop["total_recipients"]:
        drop["status"] = "exhausted"

    return {
        "drop_id": drop_id,
        "amount": chosen["amount"],
        "message": drop["message"],
        "position": total_claimed,
        "total_claimed": total_claimed,
        "total_recipients": drop["total_recipients"],
        "sender_wallet": drop["sender_wallet"],
        "claimer_wallet": wallet,
    }
