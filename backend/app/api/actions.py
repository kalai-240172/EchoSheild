import hashlib
import json
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from app.database.init_db import AsyncSessionLocal
from app.models.audit import AuditBlock, compute_audit_hash
from app.models.alert import Alert
from sqlalchemy import select, func

router = APIRouter()


class ActionRequest(BaseModel):
    call_id: int | None = None
    caller_number: str = ""
    risk_score: float = 0.0
    reason: str = ""


async def _create_audit_block(event: str, action: str, caller: str, risk_score: float):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(AuditBlock).order_by(AuditBlock.block_number.desc()).limit(1)
        )
        last = result.scalar_one_or_none()
        prev_hash = last.current_hash if last else "0" * 64
        
        result2 = await session.execute(select(func.max(AuditBlock.block_number)))
        max_block = result2.scalar()
        block_number = (max_block or 1036) + 1

        ts = datetime.utcnow()
        clean_score = round(float(risk_score), 1)
        current_hash = compute_audit_hash(
            block_number=block_number,
            timestamp=ts.isoformat(),
            event=event,
            risk_score=clean_score,
            action=action,
            caller=caller,
            previous_hash=prev_hash,
        )
        block = AuditBlock(
            block_number=block_number,
            timestamp=ts,
            event=event,
            risk_score=clean_score,
            action=action,
            caller=caller,
            previous_hash=prev_hash,
            current_hash=current_hash,
        )
        session.add(block)
        await session.commit()
        return block_number, current_hash


@router.post("/actions/mfa")
async def trigger_mfa(req: ActionRequest):
    block_number, hash_val = await _create_audit_block(
        event="MFA Triggered",
        action="Multi-Factor Authentication Requested",
        caller=req.caller_number,
        risk_score=req.risk_score,
    )
    return {
        "success": True,
        "action": "MFA_TRIGGERED",
        "message": "🔐 Multi-Factor Authentication has been requested for this caller.",
        "audit_block": block_number,
        "hash": hash_val[:16] + "...",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/actions/callback")
async def initiate_callback(req: ActionRequest):
    block_number, hash_val = await _create_audit_block(
        event="Callback Verification Initiated",
        action="Callback Verification",
        caller=req.caller_number,
        risk_score=req.risk_score,
    )
    return {
        "success": True,
        "action": "CALLBACK_INITIATED",
        "message": "📞 Callback verification initiated. The system will call back the registered number to verify caller identity.",
        "audit_block": block_number,
        "hash": hash_val[:16] + "...",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/actions/hold-transaction")
async def hold_transaction(req: ActionRequest):
    block_number, hash_val = await _create_audit_block(
        event="Transaction Hold Activated",
        action="Transaction Held",
        caller=req.caller_number,
        risk_score=req.risk_score,
    )
    return {
        "success": True,
        "action": "TRANSACTION_HELD",
        "message": "🛑 Transaction successfully held. All sensitive financial operations are paused pending identity verification.",
        "audit_block": block_number,
        "hash": hash_val[:16] + "...",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/actions/escalate")
async def escalate(req: ActionRequest):
    block_number, hash_val = await _create_audit_block(
        event="Security Escalation",
        action="Escalated to Security Team",
        caller=req.caller_number,
        risk_score=req.risk_score,
    )
    # Create high-priority alert
    async with AsyncSessionLocal() as session:
        alert = Alert(
            title="🚨 Security Escalation – Manual Review Required",
            caller_number=req.caller_number,
            risk_score=req.risk_score,
            risk_level="HIGH",
            reason=req.reason or "Security escalation triggered by operator",
            action="Escalated to Security Team",
            timestamp=datetime.utcnow(),
            read=False,
        )
        session.add(alert)
        await session.commit()

    return {
        "success": True,
        "action": "ESCALATED",
        "message": "🚨 Incident escalated to the security team. A high-priority alert has been created.",
        "audit_block": block_number,
        "hash": hash_val[:16] + "...",
        "timestamp": datetime.utcnow().isoformat(),
    }
