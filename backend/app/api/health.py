"""
Health API – EchoShield
System status and health check endpoints.
"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "system": "EchoShield",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "mode": "ACTIVE",
        "services": {
            "anti_spoofing": "operational",
            "speaker_verification": "operational",
            "prosody_analysis": "operational",
            "context_intelligence": "operational",
            "risk_engine": "operational",
            "audit_ledger": "operational",
        },
    }
