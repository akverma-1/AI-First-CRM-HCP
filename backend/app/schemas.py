from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime

# --- HCP Schemas ---
class HCPBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    institution: Optional[str] = None
    engagement_score: Optional[float] = 5.0

class HCPCreate(HCPBase):
    pass

class HCPResponse(HCPBase):
    id: int

    class Config:
        from_attributes = True

# --- Interaction Schemas ---
class InteractionBase(BaseModel):
    hcp_id: int
    interaction_type: str = "Meeting"
    date: date
    time: time
    attendees: Optional[List[str]] = []
    topics_discussed: Optional[str] = None
    materials_shared: Optional[List[str]] = []
    samples_distributed: Optional[List[str]] = []
    sentiment: str = "Neutral"
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    suggested_follow_ups: Optional[List[str]] = []

class InteractionCreate(InteractionBase):
    pass

class InteractionResponse(InteractionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI Parsing Schemas ---
class AIParseRequest(BaseModel):
    text: str

class AIParseResponse(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = "Meeting"
    date: Optional[str] = None  # YYYY-MM-DD
    time: Optional[str] = None  # HH:MM
    attendees: Optional[List[str]] = []
    topics_discussed: Optional[str] = None
    materials_shared: Optional[List[str]] = []
    samples_distributed: Optional[List[str]] = []
    sentiment: Optional[str] = "Neutral"
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    suggested_follow_ups: Optional[List[str]] = []
