"""DropN — Red Envelope style NIM drops. Create, share, claim."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import storage
from .models import (
    ClaimRequest,
    ClaimResponse,
    DropCreate,
    DropCreateResponse,
    DropResponse,
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


# ── Routes ────────────────────────────────────────────


@app.get("/")
async def root():
    return {"name": "DropN", "version": "1.0.0", "status": "online"}


@app.post("/drops", response_model=DropCreateResponse, status_code=201)
async def create_drop(data: DropCreate):
    """Create a new NIM drop. Generate random splits, return a claim link."""
    if data.recipients > 100:
        raise HTTPException(400, "Max 100 recipients per drop")

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


# ── Error handler ─────────────────────────────────────


@app.exception_handler(Exception)
async def catch_all(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse({"error": str(exc)}, status_code=500)
