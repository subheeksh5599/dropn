"""Pydantic models for DropN."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DropCreate(BaseModel):
    """Request to create a new drop."""
    amount: float = Field(gt=0, description="Total NIM to distribute")
    message: str = Field(min_length=1, max_length=200, description="Sender's message")
    recipients: int = Field(ge=2, le=100, description="Number of people who can claim")
    sender_wallet: str = Field(min_length=1, description="Sender's Nimiq wallet address")


class DropResponse(BaseModel):
    """Public view of a drop."""
    id: str
    message: str
    total_amount: float
    total_recipients: int
    claimed_count: int
    remaining: int
    status: str  # "active" | "exhausted"
    created_at: str
    claim_link: str
    sender_wallet: str
    funded: bool = False
    escrow_tx_hash: Optional[str] = None


class ClaimRequest(BaseModel):
    """Request to claim a share."""
    wallet: str = Field(min_length=1, description="Claimer's Nimiq wallet address")


class ClaimResponse(BaseModel):
    """Response after a successful claim."""
    drop_id: str
    amount: float
    message: str
    position: int  # which claim position (1, 2, 3...)
    total_claimed: int
    total_recipients: int
    sender_wallet: str
    claimer_wallet: str
    payout_tx_hash: Optional[str] = None


class FundDropRequest(BaseModel):
    """Mark a drop as funded by the sender."""
    tx_hash: str = Field(min_length=1, description="Nimiq transaction hash of the funding transfer")


class DropCreateResponse(BaseModel):
    """Response after creating a drop."""
    id: str
    claim_link: str
    message: str
    total_amount: float
    recipients: int
    status: str
    funded: bool = False
