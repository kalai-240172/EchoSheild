from sqlalchemy import Column, Integer, Float, Boolean, String
from app.models.base import Base


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    low_threshold = Column(Integer, default=39)
    medium_threshold = Column(Integer, default=69)
    high_threshold = Column(Integer, default=100)
    weight_anti_spoofing = Column(Float, default=35.0)
    weight_speaker_verification = Column(Float, default=25.0)
    weight_prosody = Column(Float, default=15.0)
    weight_context = Column(Float, default=25.0)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    webhook_notifications = Column(Boolean, default=False)
    in_app_notifications = Column(Boolean, default=True)
    audio_retention = Column(String, default="minimal")
    encryption_enabled = Column(Boolean, default=True)
    audit_logging = Column(Boolean, default=True)
