from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Interaction, HCP
from app.schemas import InteractionCreate, InteractionResponse
from typing import List

router = APIRouter(prefix="/api/interactions", tags=["Interactions"])

@router.get("/", response_model=List[InteractionResponse])
def get_interactions(db: Session = Depends(get_db)):
    return db.query(Interaction).order_by(Interaction.created_at.desc()).all()

@router.post("/", response_model=InteractionResponse)
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    # Check if HCP exists
    hcp = db.query(HCP).filter(HCP.id == data.hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")

    db_interaction = Interaction(**data.model_dump())
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

@router.get("/{interaction_id}", response_model=InteractionResponse)
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction

@router.get("/stats/summary")
def get_interaction_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total_hcps = db.query(HCP).count()
    total_interactions = db.query(Interaction).count()

    # Calculate average engagement score
    avg_engagement_res = db.query(func.avg(HCP.engagement_score)).scalar()
    avg_engagement = round(float(avg_engagement_res), 1) if avg_engagement_res is not None else 0.0

    # Calculate sentiment distribution
    sentiment_list = db.query(Interaction.sentiment, func.count(Interaction.id)).group_by(Interaction.sentiment).all()
    sentiments = {s[0]: s[1] for s in sentiment_list if s[0]}
    
    # Fill defaults if missing
    for term in ["Positive", "Neutral", "Negative"]:
        if term not in sentiments:
            sentiments[term] = 0

    # Calculate interaction type distribution
    type_list = db.query(Interaction.interaction_type, func.count(Interaction.id)).group_by(Interaction.interaction_type).all()
    types = {t[0]: t[1] for t in type_list if t[0]}
    for term in ["Meeting", "Phone Call", "Video Call", "Email", "Conference", "Webinar", "Other"]:
        if term not in types:
            types[term] = 0

    # Get top 5 doctors by engagement score
    top_hcps = db.query(HCP).order_by(HCP.engagement_score.desc()).limit(5).all()
    top_hcps_list = [{"id": h.id, "name": h.name, "specialty": h.specialty, "score": float(h.engagement_score)} for h in top_hcps]

    return {
        "total_hcps": total_hcps,
        "total_interactions": total_interactions,
        "avg_engagement": avg_engagement,
        "sentiments": sentiments,
        "types": types,
        "top_hcps": top_hcps_list
    }
