from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from app.models.base import Base


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    caller_name = Column(String, default="Unknown")
    caller_number = Column(String)
    call_source = Column(String, default="Unknown")
    duration = Column(Integer, default=0)  # seconds
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="LOW")
    spoof_score = Column(Float, default=0.0)
    speaker_match_score = Column(Float, default=0.0)
    prosody_score = Column(Float, default=0.0)
    context_score = Column(Float, default=0.0)
    action_taken = Column(String, default="Continue & Monitor")
    status = Column(String, default="Completed")
    timestamp = Column(DateTime, default=datetime.utcnow)
    reasons = Column(Text, default="")
