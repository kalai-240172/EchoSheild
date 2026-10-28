"""
Settings API – EchoShield
Configurable thresholds, weights, notifications, and privacy preferences.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.init_db import get_db
from app.models.settings import Settings

router = APIRouter()


class SettingsUpdate(BaseModel):
    low_threshold: int = Field(default=39, ge=0, le=100)
    medium_threshold: int = Field(default=69, ge=0, le=100)
    high_threshold: int = Field(default=100, ge=0, le=100)
    weight_anti_spoofing: float = Field(default=35.0, ge=0, le=100)
    weight_speaker_verification: float = Field(default=25.0, ge=0, le=100)
    weight_prosody: float = Field(default=15.0, ge=0, le=100)
    weight_context: float = Field(default=25.0, ge=0, le=100)
    email_notifications: bool = True
    sms_notifications: bool = False
    webhook_notifications: bool = False
    in_app_notifications: bool = True
    audio_retention: str = "minimal"
    encryption_enabled: bool = True
    audit_logging: bool = True


def _normalize_settings_dict(s: Settings) -> dict:
    # Ensure weights are returned as percentages (e.g. 35, not 0.35)
    as_w = s.weight_anti_spoofing if s.weight_anti_spoofing > 1.0 else s.weight_anti_spoofing * 100.0
    sv_w = s.weight_speaker_verification if s.weight_speaker_verification > 1.0 else s.weight_speaker_verification * 100.0
    pr_w = s.weight_prosody if s.weight_prosody > 1.0 else s.weight_prosody * 100.0
    cx_w = s.weight_context if s.weight_context > 1.0 else s.weight_context * 100.0

    raw_sum = as_w + sv_w + pr_w + cx_w
    if raw_sum > 0 and abs(raw_sum - 100.0) > 2.0:
        as_w = round(as_w * 100.0 / raw_sum, 1)
        sv_w = round(sv_w * 100.0 / raw_sum, 1)
        pr_w = round(pr_w * 100.0 / raw_sum, 1)
        cx_w = round(100.0 - as_w - sv_w - pr_w, 1)

    return {
        "low_threshold": s.low_threshold,
        "medium_threshold": s.medium_threshold,
        "high_threshold": s.high_threshold,
        "weight_anti_spoofing": round(as_w, 1),
        "weight_speaker_verification": round(sv_w, 1),
        "weight_prosody": round(pr_w, 1),
        "weight_context": round(cx_w, 1),
        "email_notifications": s.email_notifications,
        "sms_notifications": s.sms_notifications,
        "webhook_notifications": s.webhook_notifications,
        "in_app_notifications": getattr(s, "in_app_notifications", True),
        "audio_retention": s.audio_retention,
        "encryption_enabled": s.encryption_enabled,
        "audit_logging": s.audit_logging,
    }


@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Settings).limit(1))
    s = result.scalar_one_or_none()
    if not s:
        # Auto-seed default settings
        s = Settings(
            low_threshold=39,
            medium_threshold=69,
            high_threshold=100,
            weight_anti_spoofing=35.0,
            weight_speaker_verification=25.0,
            weight_prosody=15.0,
            weight_context=25.0,
            email_notifications=True,
            sms_notifications=False,
            webhook_notifications=False,
            audio_retention="minimal",
            encryption_enabled=True,
            audit_logging=True,
        )
        db.add(s)
        await db.commit()
        await db.refresh(s)

    return _normalize_settings_dict(s)


@router.put("/settings")
async def update_settings(update: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    if update.low_threshold >= update.medium_threshold:
        raise HTTPException(status_code=400, detail="Low threshold must be strictly less than medium threshold")
    if update.medium_threshold > update.high_threshold:
        raise HTTPException(status_code=400, detail="Medium threshold cannot exceed high threshold")

    total_w = (
        update.weight_anti_spoofing
        + update.weight_speaker_verification
        + update.weight_prosody
        + update.weight_context
    )
    if abs(total_w - 100.0) > 2.0:
        raise HTTPException(status_code=400, detail=f"Total weights must equal 100% (currently {round(total_w, 1)}%)")

    result = await db.execute(select(Settings).limit(1))
    s = result.scalar_one_or_none()
    if not s:
        s = Settings()
        db.add(s)

    for key, val in update.model_dump().items():
        if hasattr(s, key):
            setattr(s, key, val)

    await db.commit()
    await db.refresh(s)
    return {
        "success": True,
        "message": "Settings updated and persisted successfully",
        "settings": _normalize_settings_dict(s)
    }
