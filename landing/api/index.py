"""DropN API — Vercel serverless handler using FastAPI + Mangum."""
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum

import storage
from models import (
    ClaimRequest,
    ClaimResponse,
    DropCreate,
    DropCreateResponse,
    DropResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dropn-api")

# Init DB at import time (serverless cold start)
storage.init_db()

app = FastAPI(title="DropN API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api")
async def root():
    return {"name": "DropN API", "version": "1.0.0", "status": "online"}


@app.post("/api/drops", response_model=DropCreateResponse, status_code=201)
async def create_drop(data: DropCreate):
    result = storage.create_drop(
        amount=data.amount,
        message=data.message,
        recipients=data.recipients,
        sender_wallet=data.sender_wallet,
    )
    logger.info(f"Drop created: {result['id']} — {data.amount} NIM × {data.recipients} people")
    return result


@app.get("/api/drops/{drop_id}", response_model=DropResponse)
async def get_drop(drop_id: str):
    drop = storage.get_drop(drop_id)
    if not drop:
        raise HTTPException(404, "Drop not found")
    return drop


@app.post("/api/drops/{drop_id}/claim", response_model=ClaimResponse)
async def claim_drop(drop_id: str, data: ClaimRequest, request: Request):
    result = storage.claim_drop(drop_id, data.wallet)
    if not result:
        drop = storage.get_drop(drop_id)
        if drop and drop["status"] == "exhausted":
            raise HTTPException(400, "This drop has been fully claimed")
        raise HTTPException(404, "Drop not found or already claimed")
    logger.info(f"Claim: {result['claimer_wallet'][:12]}... got {result['amount']} NIM from {drop_id}")
    return result


@app.get("/api/claim/{drop_id}")
async def claim_page(drop_id: str):
    drop = storage.get_drop(drop_id)
    if not drop:
        raise HTTPException(404, "Drop not found")
    if drop["status"] == "exhausted":
        return JSONResponse({
            "status": "exhausted", "message": drop["message"],
            "total_recipients": drop["total_recipients"],
        })
    return JSONResponse({
        "status": "active", "id": drop["id"],
        "message": drop["message"], "total_amount": drop["total_amount"],
        "remaining": drop["remaining"], "total_recipients": drop["total_recipients"],
    })


# Mangum wraps FastAPI for Vercel / AWS Lambda
handler = Mangum(app)
