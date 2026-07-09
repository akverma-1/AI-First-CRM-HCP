from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import HCP
from app.schemas import HCPCreate, HCPResponse
from typing import List, Optional

router = APIRouter(prefix="/api/hcp", tags=["HCP"])

@router.get("/", response_model=List[HCPResponse])
def get_hcps(
    search: Optional[str] = Query(None, description="Search by name, specialty, or institution"),
    db: Session = Depends(get_db)
):
    query = db.query(HCP)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (HCP.name.like(search_filter)) |
            (HCP.specialty.like(search_filter)) |
            (HCP.institution.like(search_filter))
        )
    return query.all()

@router.post("/", response_model=HCPResponse)
def create_hcp(hcp_data: HCPCreate, db: Session = Depends(get_db)):
    db_hcp = HCP(**hcp_data.model_dump())
    db.add(db_hcp)
    db.commit()
    db.refresh(db_hcp)
    return db_hcp

@router.get("/{hcp_id}", response_model=HCPResponse)
def get_hcp(hcp_id: int, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    return hcp

@router.get("/{hcp_id}/history")
def get_hcp_history(hcp_id: int, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    
    from app.models import Interaction
    interactions = db.query(Interaction).filter(Interaction.hcp_id == hcp_id).order_by(Interaction.date.desc(), Interaction.time.desc()).all()
    return {
        "hcp": hcp,
        "history": interactions
    }

@router.get("/{hcp_id}/next-action")
def get_hcp_next_action(hcp_id: int, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
        
    from app.models import Interaction
    from app.config import settings
    from openai import OpenAI

    last_interaction = db.query(Interaction).filter(Interaction.hcp_id == hcp_id).order_by(Interaction.date.desc(), Interaction.time.desc()).first()
    
    # Construct history description for prompt
    if last_interaction:
        history_desc = f"""- Last interaction type: {last_interaction.interaction_type}
- Topics discussed: {last_interaction.topics_discussed}
- Sentiment: {last_interaction.sentiment}
- Outcomes: {last_interaction.outcomes}
- Last follow-up recorded: {last_interaction.follow_up_actions}"""
    else:
        history_desc = "No meetings have been logged yet."

    prompt = f"""You are an AI sales strategist for a pharmaceutical CRM.
Analyze the doctor's details and last meeting summary, then write a single-paragraph recommended "Next Best Action" (maximum 3 sentences) for the sales representative.
Make it highly personalized, tactical, and context-aware.

Doctor Profile:
- Name: Dr. {hcp.name}
- Specialty: {hcp.specialty}
- Institution: {hcp.institution}
- Engagement Score: {hcp.engagement_score}/10

Meeting History:
{history_desc}
"""

    try:
        if not settings.openai_api_key or settings.openai_api_key.startswith("your_"):
            raise Exception("OpenAI API key not set properly in .env")
            
        client = OpenAI(api_key=settings.openai_api_key)
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional pharmaceutical sales strategist. Be specific, actionable, and brief."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=150
        )
        recommendation = completion.choices[0].message.content.strip()
        return {"recommendation": recommendation}
        
    except Exception as e:
        print(f"OpenAI error in next-action: {e}. Using local heuristic recommendation...")
        
        # Rule-based suggestions based on engagement score and specialty
        if hcp.engagement_score >= 8.5:
            rec = f"Dr. {hcp.name} has high engagement ({hcp.engagement_score}/10). Schedule a priority face-to-face meeting or share the OncoBoost Phase III Clinical Trials PDF to secure their inclusion in the upcoming advisory panel."
        elif last_interaction and "oncology" in str(last_interaction.topics_discussed).lower():
            rec = f"Since you discussed oncology trials last time with Dr. {hcp.name}, send the OncoBoost comparative safety study results as a follow-up email and propose a brief video call next week."
        elif last_interaction and last_interaction.sentiment == "Negative":
            rec = f"Dr. {hcp.name} expressed some concerns in the last interaction. Schedule an in-person visit to address their queries directly with product handouts."
        else:
            rec = f"Schedule a brief call with Dr. {hcp.name} at {hcp.institution} to share the new product brochure and invite them to our upcoming regional medical webinar."
            
        return {"recommendation": rec}
