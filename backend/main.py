"""DropN — Red Envelope style NIM drops. Create, share, claim."""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from . import storage
from .storage import ESCROW_PRIVATE_KEY, ESCROW_NETWORK
from .models import (
    ClaimRequest,
    ClaimResponse,
    DropCreate,
    DropCreateResponse,
    DropResponse,
    FundDropRequest,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dropn")


@asynccontextmanager
async def lifespan(app: FastAPI):
    storage.init_db()
    logger.info("DropN database initialized")
    yield


app = FastAPI(title="DropN", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve built frontend (for unified Render deploy)
FRONTEND_DIR = Path(__file__).parent.parent / "landing" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")
    # Favicon and other root-level static files
    for static_file in FRONTEND_DIR.glob("*"):
        if static_file.is_file():
            app.mount(f"/{static_file.name}", StaticFiles(directory=str(FRONTEND_DIR)), name=f"root_{static_file.stem}")


# ── Routes ────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"name": "DropN", "version": "1.0.0", "status": "online"}


@app.post("/drops", response_model=DropCreateResponse, status_code=201)
async def create_drop(data: DropCreate):
    """Create a new NIM drop. Generate random splits, return a claim link."""
    result = storage.create_drop(
        amount=data.amount,
        message=data.message,
        recipients=data.recipients,
        sender_wallet=data.sender_wallet,
    )
    logger.info(
        f"Drop created: {result['id']} — {data.amount} NIM × {data.recipients} people"
    )
    return result


@app.get("/drops/{drop_id}", response_model=DropResponse)
async def get_drop(drop_id: str):
    """View drop status — how many claimed, remaining, link."""
    drop = storage.get_drop(drop_id)
    if not drop:
        raise HTTPException(404, "Drop not found")
    return drop


@app.post("/drops/{drop_id}/claim", response_model=ClaimResponse)
async def claim_drop(drop_id: str, data: ClaimRequest, request: Request):
    """Claim a random share of a drop."""
    result = storage.claim_drop(drop_id, data.wallet)
    if not result:
        # Check if drop exists but is exhausted
        drop = storage.get_drop(drop_id)
        if drop and drop["status"] == "exhausted":
            raise HTTPException(400, "This drop has been fully claimed")
        raise HTTPException(404, "Drop not found or already claimed")

    logger.info(
        f"Claim: {result['claimer_wallet'][:12]}... got {result['amount']} NIM from {drop_id}"
    )
    return result


@app.get("/claim/{drop_id}")
async def claim_page(drop_id: str):
    """Landing page for a claim link — returns drop info for the frontend."""
    drop = storage.get_drop(drop_id)
    if not drop:
        raise HTTPException(404, "Drop not found")
    if drop["status"] == "exhausted":
        return JSONResponse(
            {"status": "exhausted", "message": drop["message"],
             "total_recipients": drop["total_recipients"]}
        )
    return JSONResponse(
        {
            "status": "active",
            "id": drop["id"],
            "message": drop["message"],
            "total_amount": drop["total_amount"],
            "remaining": drop["remaining"],
            "total_recipients": drop["total_recipients"],
        }
    )


@app.get("/escrow")
async def escrow_status():
    """Check if escrow wallet is configured."""
    addr = storage.get_escrow_address()
    return {"configured": ESCROW_PRIVATE_KEY != "", "network": ESCROW_NETWORK}


@app.post("/drops/{drop_id}/fund")
async def fund_drop(drop_id: str, data: FundDropRequest):
    """Mark a drop as funded by the sender (after NIM has been sent)."""
    ok = storage.mark_drop_funded(drop_id, data.tx_hash)
    if not ok:
        raise HTTPException(404, "Drop not found or already funded")
    return {"status": "funded", "drop_id": drop_id, "tx_hash": data.tx_hash}


# ── Error handler ─────────────────────────────────────


@app.exception_handler(Exception)
async def catch_all(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse({"error": str(exc)}, status_code=500)


# ── SPA fallback (serve index.html for client-side routes) ──
if FRONTEND_DIR.exists():
    from fastapi.responses import FileResponse

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        """Serve index.html for any non-API route (SPA client-side routing)."""
        # API routes are handled above — this catches everything else
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return JSONResponse({"error": "Frontend not built"}, status_code=404)
