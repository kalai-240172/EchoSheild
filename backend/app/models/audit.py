import hashlib
import json
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from app.models.base import Base


def compute_audit_hash(
    block_number: int,
    timestamp: str,
    event: str,
    risk_score: float,
    action: str,
    caller: str,
    previous_hash: str
) -> str:
    ts_str = str(timestamp).replace(" ", "T")
    clean_score = round(float(risk_score), 1)
    clean_event = event.replace("\ufffd", "-").replace("–", "-")
    data = {
        "action": str(action),
        "block_number": int(block_number),
        "caller": str(caller),
        "event": clean_event,
        "previous_hash": str(previous_hash),
        "risk_score": clean_score,
        "timestamp": ts_str,
    }
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode("utf-8")).hexdigest()


class AuditBlock(Base):
    __tablename__ = "audit_blocks"

    id = Column(Integer, primary_key=True, index=True)
    block_number = Column(Integer, unique=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event = Column(String)
    risk_score = Column(Float, default=0.0)
    action = Column(String)
    caller = Column(String, default="")
    previous_hash = Column(String)
    current_hash = Column(String)
    verified = Column(String, default="VERIFIED")
