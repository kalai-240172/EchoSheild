"""
Alerts API – EchoShield
Real-time security alerts management and resolution tracking.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database.init_db import get_db
from app.models.alert import Alert

router = APIRouter()


@router.get("/alerts")
async def get_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).order_by(desc(Alert.timestamp)).limit(50))
    alerts = result.scalars().all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "caller_number": a.caller_number,
            "risk_score": a.risk_score,
            "risk_level": a.risk_level,
            "reason": a.reason,
            "action": a.action,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "read": a.read,
        }
        for a in alerts
    ]


@router.patch("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.read = True
    await db.commit()
    return {"success": True, "id": alert_id, "read": True}


@router.patch("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.read = True
    alert.title = alert.title.replace("Detected", "Resolved").replace("🚨", "✓")
    await db.commit()
    return {"success": True, "id": alert_id, "resolved": True}


@router.post("/alerts/mark-all-read")
async def mark_all_alerts_read(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.read == False))
    alerts = result.scalars().all()
    for a in alerts:
        a.read = True
    await db.commit()
    return {"success": True, "count": len(alerts)}
