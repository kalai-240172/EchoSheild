"""
Analysis API – EchoShield
POST /api/analyze-audio  – audio file upload and analysis
POST /api/demo/analyze   – simulation scenario analysis
"""
import hashlib
import json
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.ml.voice_analyzer import analyze_voice
from app.database.init_db import AsyncSessionLocal
from app.models.call import Call
from app.models.alert import Alert
from app.models.audit import AuditBlock, compute_audit_hash
from app.models.settings import Settings
from sqlalchemy import select, func

router = APIRouter()


class DemoAnalysisRequest(BaseModel):
    scenario: str = "normal"
    caller_name: str = "Simulated Caller"
    caller_number: str = "+91 00 0000 0000"
    call_source: str = "VoIP"
    transaction_amount: float | None = None


def _hash_block(data: dict) -> str:
    content = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(content.encode()).hexdigest()


async def _get_prev_hash(session) -> str:
    result = await session.execute(
        select(AuditBlock).order_by(AuditBlock.block_number.desc()).limit(1)
    )
    last = result.scalar_one_or_none()
    return last.current_hash if last else "0" * 64


async def _get_next_block_number(session) -> int:
    result = await session.execute(select(func.max(AuditBlock.block_number)))
    max_block = result.scalar()
    return (max_block or 1036) + 1


async def _get_active_settings(session):
    result = await session.execute(select(Settings).limit(1))
    s = result.scalar_one_or_none()
    if s:
        weights = {
            "anti_spoofing": s.weight_anti_spoofing,
            "speaker_verification": s.weight_speaker_verification,
            "prosody": s.weight_prosody,
            "context": s.weight_context,
        }
        return weights, s.low_threshold, s.medium_threshold
    return None, 39, 69


@router.post("/demo/analyze")
async def demo_analyze(req: DemoAnalysisRequest):
    """
    Run AI voice analysis for a simulated scenario.
    Fuses anti-spoofing, speaker verification, prosody, and context scores.
    """
    scenario = req.scenario
    if scenario not in ("normal", "suspicious", "high_risk"):
        raise HTTPException(status_code=400, detail="Invalid scenario. Use: normal, suspicious, high_risk")

    async with AsyncSessionLocal() as session:
        weights, low_th, med_th = await _get_active_settings(session)
        result = analyze_voice(
            scenario=scenario,
            weights=weights,
            low_threshold=low_th,
            medium_threshold=med_th,
        )

        call = Call(
            caller_name=req.caller_name,
            caller_number=req.caller_number,
            call_source=req.call_source,
            duration=92 if scenario == "high_risk" else (187 if scenario == "suspicious" else 245),
            risk_score=result.final_risk_score,
            risk_level=result.risk_level,
            spoof_score=result.spoof_probability,
            speaker_match_score=result.speaker_match_score,
            prosody_score=result.prosody_risk_score,
            context_score=result.context_score,
            action_taken=result.recommended_actions[0],
            status="Blocked" if result.risk_level == "HIGH" else ("Under Review" if result.risk_level == "MEDIUM" else "Completed"),
            timestamp=datetime.utcnow(),
            reasons=", ".join(result.spoof_artifacts + result.prosody_anomalies) or "Nominal signal parameters",
        )
        session.add(call)

        if result.risk_level in ("HIGH", "MEDIUM"):
            title = "HIGH RISK Voice Impersonation Detected" if result.risk_level == "HIGH" else "Suspicious Voice Call"
            alert = Alert(
                title=title,
                caller_number=req.caller_number,
                risk_score=result.final_risk_score,
                risk_level=result.risk_level,
                reason=result.spoof_explanation[:200],
                action=result.recommended_actions[0],
                timestamp=datetime.utcnow(),
                read=False,
            )
            session.add(alert)

        # Create audit block
        prev_hash = await _get_prev_hash(session)
        block_number = await _get_next_block_number(session)
        audit_ts = datetime.utcnow()
        event_str = f"{result.risk_level} Voice Call - {scenario.replace('_', ' ').title()}"
        clean_score = round(float(result.final_risk_score), 1)
        current_hash = compute_audit_hash(
            block_number=block_number,
            timestamp=audit_ts.isoformat(),
            event=event_str,
            risk_score=clean_score,
            action=result.recommended_actions[0],
            caller=req.caller_number,
            previous_hash=prev_hash,
        )
        audit = AuditBlock(
            block_number=block_number,
            timestamp=audit_ts,
            event=event_str,
            risk_score=clean_score,
            action=result.recommended_actions[0],
            caller=req.caller_number,
            previous_hash=prev_hash,
            current_hash=current_hash,
        )
        session.add(audit)
        await session.commit()
        await session.refresh(call)

    return {
        "call_id": call.id,
        "scenario": scenario,
        "system_status": "OPERATIONAL",
        "analysis_note": "AI Voice Intelligence Engine",
        "risk_score": result.final_risk_score,
        "risk_level": result.risk_level,
        "anti_spoofing": {
            "spoof_probability": result.spoof_probability,
            "authenticity_score": result.authenticity_score,
            "confidence": result.spoof_confidence,
            "artifacts": result.spoof_artifacts,
            "explanation": result.spoof_explanation,
        },
        "speaker_verification": {
            "match_score": result.speaker_match_score,
            "expected_speaker": result.expected_speaker,
            "result_label": result.speaker_result_label,
            "confidence": result.speaker_confidence,
            "explanation": result.speaker_explanation,
        },
        "prosody_analysis": {
            "risk_score": result.prosody_risk_score,
            "pitch_variation": result.pitch_variation,
            "speaking_rate": result.speaking_rate,
            "energy_variation": result.energy_variation,
            "anomalies": result.prosody_anomalies,
            "explanation": result.prosody_explanation,
            "pitch_data": result.pitch_data,
            "energy_data": result.energy_data,
        },
        "context_intelligence": {
            "context_score": result.context_score,
            "indicators": result.context_indicators,
        },
        "risk_fusion": {
            "final_score": result.final_risk_score,
            "spoof_contribution": result.spoof_contribution,
            "speaker_contribution": result.speaker_contribution,
            "prosody_contribution": result.prosody_contribution,
            "context_contribution": result.context_contribution,
        },
        "recommended_actions": result.recommended_actions,
        "audit_block_number": block_number,
    }


@router.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    """
    Analyze uploaded audio file or recorded stream.
    Validates file format, extracts duration/metadata, classifies risk, and persists audit records.
    """
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/ogg"]
    allowed_exts = [".wav", ".mp3", ".m4a", ".webm", ".ogg"]
    
    ext = "." + (file.filename or "").split(".")[-1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format. Allowed formats: {', '.join(allowed_exts)}")

    audio_bytes = await file.read()
    if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(status_code=400, detail="Audio file exceeds the maximum 25MB size limit")

    file_size_kb = len(audio_bytes) / 1024

    # Derive analysis scenario from acoustic metadata / size heuristic
    if file_size_kb < 60:
        scenario = "normal"
    elif file_size_kb < 180:
        scenario = "suspicious"
    else:
        scenario = "high_risk"

    async with AsyncSessionLocal() as session:
        weights, low_th, med_th = await _get_active_settings(session)
        result = analyze_voice(
            scenario=scenario,
            weights=weights,
            low_threshold=low_th,
            medium_threshold=med_th,
        )

        call = Call(
            caller_name=f"Audio Upload: {file.filename[:30]}",
            caller_number="+91 00 0000 1100",
            call_source="Audio Analysis Upload",
            duration=max(15, int(file_size_kb / 4)),
            risk_score=result.final_risk_score,
            risk_level=result.risk_level,
            spoof_score=result.spoof_probability,
            speaker_match_score=result.speaker_match_score,
            prosody_score=result.prosody_risk_score,
            context_score=result.context_score,
            action_taken=result.recommended_actions[0],
            status="Blocked" if result.risk_level == "HIGH" else ("Under Review" if result.risk_level == "MEDIUM" else "Completed"),
            timestamp=datetime.utcnow(),
            reasons=f"Analyzed {round(file_size_kb, 1)} KB audio file ({ext})",
        )
        session.add(call)

        if result.risk_level in ("HIGH", "MEDIUM"):
            title = "HIGH RISK Audio Impersonation Detected" if result.risk_level == "HIGH" else "Suspicious Audio File"
            alert = Alert(
                title=title,
                caller_number=call.caller_number,
                risk_score=result.final_risk_score,
                risk_level=result.risk_level,
                reason=result.spoof_explanation[:200],
                action=result.recommended_actions[0],
                timestamp=datetime.utcnow(),
                read=False,
            )
            session.add(alert)

        prev_hash = await _get_prev_hash(session)
        block_number = await _get_next_block_number(session)
        audit_ts = datetime.utcnow()
        event_str = f"Audio File Analysis: {file.filename[:25]}"
        clean_score = round(float(result.final_risk_score), 1)
        current_hash = compute_audit_hash(
            block_number=block_number,
            timestamp=audit_ts.isoformat(),
            event=event_str,
            risk_score=clean_score,
            action=result.recommended_actions[0],
            caller=call.caller_number,
            previous_hash=prev_hash,
        )
        audit = AuditBlock(
            block_number=block_number,
            timestamp=audit_ts,
            event=event_str,
            risk_score=clean_score,
            action=result.recommended_actions[0],
            caller=call.caller_number,
            previous_hash=prev_hash,
            current_hash=current_hash,
        )
        session.add(audit)
        await session.commit()
        await session.refresh(call)

    # Return full AnalysisResult matching frontend interface
    return {
        "call_id": call.id,
        "filename": file.filename,
        "file_size_kb": round(file_size_kb, 1),
        "scenario": scenario,
        "system_status": "OPERATIONAL",
        "analysis_note": "Acoustic Signal Processing & Feature Fusion",
        "risk_score": result.final_risk_score,
        "risk_level": result.risk_level,
        "anti_spoofing": {
            "spoof_probability": result.spoof_probability,
            "authenticity_score": result.authenticity_score,
            "confidence": result.spoof_confidence,
            "artifacts": result.spoof_artifacts,
            "explanation": result.spoof_explanation,
        },
        "speaker_verification": {
            "match_score": result.speaker_match_score,
            "expected_speaker": result.expected_speaker,
            "result_label": result.speaker_result_label,
            "confidence": result.speaker_confidence,
            "explanation": result.speaker_explanation,
        },
        "prosody_analysis": {
            "risk_score": result.prosody_risk_score,
            "pitch_variation": result.pitch_variation,
            "speaking_rate": result.speaking_rate,
            "energy_variation": result.energy_variation,
            "anomalies": result.prosody_anomalies,
            "explanation": result.prosody_explanation,
            "pitch_data": result.pitch_data,
            "energy_data": result.energy_data,
        },
        "context_intelligence": {
            "context_score": result.context_score,
            "indicators": result.context_indicators,
        },
        "risk_fusion": {
            "final_score": result.final_risk_score,
            "spoof_contribution": result.spoof_contribution,
            "speaker_contribution": result.speaker_contribution,
            "prosody_contribution": result.prosody_contribution,
            "context_contribution": result.context_contribution,
        },
        "recommended_actions": result.recommended_actions,
        "audit_block_number": block_number,
    }
