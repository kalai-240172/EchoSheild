"""
Database initialization and SQLite setup.
EchoShield – Real-Time Voice Impersonation Defense
"""
import hashlib
import json
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import inspect, text, select, func
from app.models.base import Base
from app.models.call import Call
from app.models.alert import Alert
from app.models.audit import AuditBlock, compute_audit_hash
from app.models.settings import Settings

DATABASE_URL = "sqlite+aiosqlite:///./echoshield.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


def _hash_block(data: dict) -> str:
    content = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(content.encode()).hexdigest()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Automatic schema migration for existing databases
        columns = await conn.run_sync(
            lambda sync_conn: [c["name"] for c in inspect(sync_conn).get_columns("settings")]
        )
        if "in_app_notifications" not in columns:
            await conn.execute(text("ALTER TABLE settings ADD COLUMN in_app_notifications BOOLEAN DEFAULT 1"))

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(func.count()).select_from(Call))
        count = result.scalar()
        if count and count > 0:
            return

        # Seed settings with consistent percentage weights
        default_settings = Settings(
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
            in_app_notifications=True,
            audio_retention="minimal",
            encryption_enabled=True,
            audit_logging=True,
        )
        session.add(default_settings)

        # Seed initial sample calls
        now = datetime.utcnow()
        sample_calls = [
            {
                "caller_name": "Rahul Sharma",
                "caller_number": "+91 11 2345 6789",
                "call_source": "Enterprise VoIP",
                "duration": 92,
                "risk_score": 91,
                "risk_level": "HIGH",
                "spoof_score": 92,
                "speaker_match_score": 42,
                "prosody_score": 71,
                "context_score": 95,
                "action_taken": "Transaction Held",
                "status": "Blocked",
                "timestamp": now - timedelta(minutes=5),
            },
            {
                "caller_name": "Priya Menon",
                "caller_number": "+91 98765 43210",
                "call_source": "Mobile Network",
                "duration": 187,
                "risk_score": 61,
                "risk_level": "MEDIUM",
                "spoof_score": 58,
                "speaker_match_score": 61,
                "prosody_score": 55,
                "context_score": 70,
                "action_taken": "Secondary Verification",
                "status": "Under Review",
                "timestamp": now - timedelta(minutes=23),
            },
            {
                "caller_name": "Amit Verma",
                "caller_number": "+91 80 1234 5678",
                "call_source": "PSTN",
                "duration": 245,
                "risk_score": 18,
                "risk_level": "LOW",
                "spoof_score": 12,
                "speaker_match_score": 88,
                "prosody_score": 20,
                "context_score": 15,
                "action_taken": "Continue & Monitor",
                "status": "Completed",
                "timestamp": now - timedelta(hours=1),
            },
            {
                "caller_name": "Sneha Kapoor",
                "caller_number": "+91 22 4567 8901",
                "call_source": "Enterprise VoIP",
                "duration": 312,
                "risk_score": 24,
                "risk_level": "LOW",
                "spoof_score": 18,
                "speaker_match_score": 91,
                "prosody_score": 22,
                "context_score": 20,
                "action_taken": "Continue & Monitor",
                "status": "Completed",
                "timestamp": now - timedelta(hours=2),
            },
            {
                "caller_name": "Unknown Caller",
                "caller_number": "+91 70 0000 1234",
                "call_source": "Unknown",
                "duration": 45,
                "risk_score": 78,
                "risk_level": "HIGH",
                "spoof_score": 85,
                "speaker_match_score": 30,
                "prosody_score": 75,
                "context_score": 88,
                "action_taken": "MFA Triggered",
                "status": "Blocked",
                "timestamp": now - timedelta(hours=3),
            },
        ]

        for c in sample_calls:
            call_obj = Call(**c)
            session.add(call_obj)

        # Seed initial sample alerts
        sample_alerts = [
            {
                "title": "HIGH RISK Voice Impersonation Detected",
                "caller_number": "+91 11 2345 6789",
                "risk_score": 91,
                "risk_level": "HIGH",
                "reason": "Synthetic speech indicators detected; speaker mismatch; suspicious transaction context",
                "action": "Transaction Held",
                "timestamp": now - timedelta(minutes=5),
                "read": False,
            },
            {
                "title": "Suspicious Speaker – Secondary Verification Required",
                "caller_number": "+91 98765 43210",
                "risk_score": 61,
                "risk_level": "MEDIUM",
                "reason": "Moderate spoof probability; unusual prosody pattern",
                "action": "Secondary Verification",
                "timestamp": now - timedelta(minutes=23),
                "read": False,
            },
            {
                "title": "Normal Call Completed",
                "caller_number": "+91 80 1234 5678",
                "risk_score": 18,
                "risk_level": "LOW",
                "reason": "All signals nominal",
                "action": "Continue & Monitor",
                "timestamp": now - timedelta(hours=1),
                "read": True,
            },
            {
                "title": "HIGH RISK – Unverified Caller",
                "caller_number": "+91 70 0000 1234",
                "risk_score": 78,
                "risk_level": "HIGH",
                "reason": "High synthetic speech probability; no caller history",
                "action": "MFA Triggered",
                "timestamp": now - timedelta(hours=3),
                "read": True,
            },
        ]

        for a in sample_alerts:
            alert_obj = Alert(**a)
            session.add(alert_obj)

        # Seed initial audit ledger blocks
        prev_hash = "0" * 64
        audit_events = [
            {"event": "System Initialized", "risk_score": 0, "action": "System Start", "caller": "System"},
            {"event": "Normal Call Completed", "risk_score": 18, "action": "Continue & Monitor", "caller": "+91 80 1234 5678"},
            {"event": "Normal Call Completed", "risk_score": 24, "action": "Continue & Monitor", "caller": "+91 22 4567 8901"},
            {"event": "HIGH RISK – Unverified Caller", "risk_score": 78, "action": "MFA Triggered", "caller": "+91 70 0000 1234"},
            {"event": "Suspicious Voice Call", "risk_score": 61, "action": "Secondary Verification", "caller": "+91 98765 43210"},
            {"event": "HIGH RISK Voice Impersonation Detected", "risk_score": 91, "action": "Transaction Held", "caller": "+91 11 2345 6789"},
        ]

        block_timestamps = [
            now - timedelta(days=1),
            now - timedelta(hours=3, minutes=30),
            now - timedelta(hours=2, minutes=15),
            now - timedelta(hours=3),
            now - timedelta(minutes=23),
            now - timedelta(minutes=5),
        ]

        for i, (ev, ts) in enumerate(zip(audit_events, block_timestamps)):
            clean_score = round(float(ev["risk_score"]), 1)
            current_hash = compute_audit_hash(
                block_number=1037 + i,
                timestamp=ts.isoformat(),
                event=ev["event"],
                risk_score=clean_score,
                action=ev["action"],
                caller=ev["caller"],
                previous_hash=prev_hash,
            )
            block = AuditBlock(
                block_number=1037 + i,
                timestamp=ts,
                event=ev["event"],
                risk_score=clean_score,
                action=ev["action"],
                caller=ev["caller"],
                previous_hash=prev_hash,
                current_hash=current_hash,
            )
            session.add(block)
            prev_hash = current_hash

        await session.commit()
