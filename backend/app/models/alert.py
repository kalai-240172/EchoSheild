from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from datetime import datetime
from app.models.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    caller_number = Column(String)
    risk_score = Column(Float)
    risk_level = Column(String)
    reason = Column(String)
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    read = Column(Boolean, default=False)
