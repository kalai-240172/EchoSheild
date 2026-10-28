from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database.init_db import get_db
from app.models.call import Call

router = APIRouter()


@router.get("/calls")
async def get_calls(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Call).order_by(desc(Call.timestamp)).limit(50))
    calls = result.scalars().all()
    return [
        {
            "id": c.id,
            "caller_name": c.caller_name,
            "caller_number": c.caller_number,
            "call_source": c.call_source,
            "duration": c.duration,
            "risk_score": c.risk_score,
            "risk_level": c.risk_level,
            "spoof_score": c.spoof_score,
            "speaker_match_score": c.speaker_match_score,
            "prosody_score": c.prosody_score,
            "context_score": c.context_score,
            "action_taken": c.action_taken,
            "status": c.status,
            "timestamp": c.timestamp.isoformat() if c.timestamp else None,
            "reasons": c.reasons,
        }
        for c in calls
    ]


@router.get("/calls/{call_id}")
async def get_call(call_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Call).where(Call.id == call_id))
    call = result.scalar_one_or_none()
    if not call:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Call not found")
    return {
        "id": call.id,
        "caller_name": call.caller_name,
        "caller_number": call.caller_number,
        "call_source": call.call_source,
        "duration": call.duration,
        "risk_score": call.risk_score,
        "risk_level": call.risk_level,
        "spoof_score": call.spoof_score,
        "speaker_match_score": call.speaker_match_score,
        "prosody_score": call.prosody_score,
        "context_score": call.context_score,
        "action_taken": call.action_taken,
        "status": call.status,
        "timestamp": call.timestamp.isoformat() if call.timestamp else None,
        "reasons": call.reasons,
    }
