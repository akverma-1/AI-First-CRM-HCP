from sqlalchemy import Column, Integer, String, Float, Text, Date, Time, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    specialty = Column(String(255), nullable=True)
    institution = Column(String(255), nullable=True)
    engagement_score = Column(Float, default=5.0)

    interactions = relationship("Interaction", back_populates="hcp", cascade="all, delete-orphan")

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id", ondelete="CASCADE"), nullable=False)
    interaction_type = Column(String(50), nullable=False, default="Meeting")
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    attendees = Column(JSON, nullable=True)  # List of attendee names
    topics_discussed = Column(Text, nullable=True)
    materials_shared = Column(JSON, nullable=True)  # List of materials
    samples_distributed = Column(JSON, nullable=True)  # List of samples
    sentiment = Column(String(50), nullable=False, default="Neutral")  # Positive, Neutral, Negative
    outcomes = Column(Text, nullable=True)
    follow_up_actions = Column(Text, nullable=True)
    suggested_follow_ups = Column(JSON, nullable=True)  # List of AI suggested follow-up texts
    created_at = Column(DateTime, default=datetime.utcnow)

    hcp = relationship("HCP", back_populates="interactions")
