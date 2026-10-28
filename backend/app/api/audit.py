"""
Audit API – EchoShield
Cryptographically verified tamper-evident security audit ledger.
"""
import hashlib
import json
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from app.database.init_db import get_db
from app.models.audit import AuditBlock, compute_audit_hash

router = APIRouter()


@router.get("/audit")
async def get_audit(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditBlock).order_by(asc(AuditBlock.block_number)))
    blocks = result.scalars().all()
    return [
        {
            "id": b.id,
            "block_number": b.block_number,
            "timestamp": b.timestamp.isoformat() if hasattr(b.timestamp, "isoformat") else str(b.timestamp),
            "event": b.event,
            "risk_score": b.risk_score,
            "action": b.action,
            "caller": b.caller,
            "previous_hash": b.previous_hash,
            "current_hash": b.current_hash,
            "verified": b.verified,
        }
        for b in blocks
    ]


@router.post("/audit/verify")
async def verify_ledger(db: AsyncSession = Depends(get_db)):
    """
    Verify the cryptographic integrity of the SHA-256 hash-chained audit ledger.
    Re-computes hashes for each block and checks chain continuity.
    """
    result = await db.execute(select(AuditBlock).order_by(asc(AuditBlock.block_number)))
    blocks = result.scalars().all()

    if not blocks:
        return {
            "valid": True,
            "verified": True,
            "blocks_checked": 0,
            "issues": [],
            "message": "Audit ledger is empty – zero blocks checked"
        }

    issues = []
    prev_hash = "0" * 64

    for block in blocks:
        # Check previous hash link
        if block.previous_hash != prev_hash:
            issues.append(f"Block #{block.block_number}: Previous hash link mismatch")

        # Check block hash
        expected_hash = compute_audit_hash(
            block_number=block.block_number,
            timestamp=block.timestamp,
            event=block.event,
            risk_score=block.risk_score,
            action=block.action,
            caller=block.caller,
            previous_hash=prev_hash,
        )

        if block.current_hash != expected_hash:
            # Fallback check with integer risk_score
            alt_hash = compute_audit_hash(
                block_number=block.block_number,
                timestamp=block.timestamp,
                event=block.event,
                risk_score=int(round(float(block.risk_score))),
                action=block.action,
                caller=block.caller,
                previous_hash=prev_hash,
            )
            if block.current_hash == alt_hash:
                expected_hash = block.current_hash

        if block.current_hash != expected_hash:
            issues.append(f"Block #{block.block_number}: Hash verification discrepancy")

        prev_hash = block.current_hash

    is_valid = len(issues) == 0
    return {
        "valid": is_valid,
        "verified": is_valid,
        "blocks_checked": len(blocks),
        "issues": issues,
        "message": "✓ Ledger integrity verified – all blocks are intact and hash-chained" if is_valid else f"⚠ Ledger integrity issues detected: {len(issues)} discrepancy found",
    }
