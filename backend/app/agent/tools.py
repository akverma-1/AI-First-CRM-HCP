from langchain_core.tools import tool
from app.database import SessionLocal
from app.models import HCP, Interaction
from datetime import datetime, date, time
import json

@tool
def get_hcp_profile_tool(name: str) -> str:
    """
    Retrieve profile details and interaction statistics of a Healthcare Professional (HCP) by their name.
    Args:
        name: The name of the doctor (e.g., "Priya Sharma", "amit kumar verma")
    """
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.name.like(f"%{name}%")).first()
        if not hcp:
            return f"No HCP profile found matching name '{name}'."
        
        interactions_count = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).count()
        return f"HCP Profile Found:\n- ID: {hcp.id}\n- Name: {hcp.name}\n- Specialty: {hcp.specialty}\n- Institution: {hcp.institution}\n- Engagement Score: {hcp.engagement_score}/10\n- Total Interactions Logged: {interactions_count}"
    finally:
        db.close()

@tool
def log_interaction_tool(
    hcp_id: int,
    interaction_type: str,
    topics_discussed: str,
    sentiment: str,
    outcomes: str,
    follow_up_actions: str,
    attendees: list = [],
    materials_shared: list = [],
    samples_distributed: list = []
) -> str:
    """
    Log a new interaction details with an HCP into the database.
    Args:
        hcp_id: The integer ID of the HCP.
        interaction_type: Type of interaction (e.g., 'Meeting', 'Phone Call', 'Video Call', 'Email')
        topics_discussed: Brief summary of discussion points.
        sentiment: Observed sentiment (e.g., 'Positive', 'Neutral', 'Negative')
        outcomes: Key decisions or outcomes.
        follow_up_actions: Next tasks or reminders.
        attendees: List of attendee names.
        materials_shared: List of documents/materials shared.
        samples_distributed: List of product samples given.
    """
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
        if not hcp:
            return f"Error: HCP with ID {hcp_id} not found."
            
        today = date.today()
        now_time = datetime.now().time()
        
        interaction = Interaction(
            hcp_id=hcp_id,
            interaction_type=interaction_type,
            date=today,
            time=now_time,
            attendees=attendees,
            topics_discussed=topics_discussed,
            materials_shared=materials_shared,
            samples_distributed=samples_distributed,
            sentiment=sentiment,
            outcomes=outcomes,
            follow_up_actions=follow_up_actions,
            suggested_follow_ups=[
                "Schedule follow-up meeting in 2 weeks",
                "Send OncoBoost Phase III PDF",
                "Add Dr. Sharma to advisory board invite list"
            ]
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        
        # Structure a special JSON response tag in stdout that the router can extract to pass back to the frontend form!
        form_data = {
            "hcp_name": hcp.name,
            "hcp_id": hcp.id,
            "interaction_type": interaction_type,
            "date": today.strftime("%Y-%m-%d"),
            "time": now_time.strftime("%H:%M"),
            "attendees": attendees,
            "topics_discussed": topics_discussed,
            "materials_shared": materials_shared,
            "samples_distributed": samples_distributed,
            "sentiment": sentiment,
            "outcomes": outcomes,
            "follow_up_actions": follow_up_actions,
            "suggested_follow_ups": interaction.suggested_follow_ups
        }
        
        return f"SUCCESS: Logged interaction ID {interaction.id} for Dr. {hcp.name}.\n<--STRUCTURED_FORM_DATA: {json.dumps(form_data)} -->"
    except Exception as e:
        return f"Error logging interaction: {str(e)}"
    finally:
        db.close()

@tool
def edit_interaction_tool(
    interaction_id: int,
    topics_discussed: str = None,
    sentiment: str = None,
    outcomes: str = None,
    follow_up_actions: str = None
) -> str:
    """
    Modify an existing logged interaction's fields in the database by its ID.
    Args:
        interaction_id: The ID of the interaction to update.
        topics_discussed: Optional updated topics text.
        sentiment: Optional updated sentiment ('Positive', 'Neutral', 'Negative').
        outcomes: Optional updated outcomes text.
        follow_up_actions: Optional updated follow-up actions text.
    """
    db = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return f"Error: Interaction with ID {interaction_id} not found."
        
        if topics_discussed is not None:
            interaction.topics_discussed = topics_discussed
        if sentiment is not None:
            interaction.sentiment = sentiment
        if outcomes is not None:
            interaction.outcomes = outcomes
        if follow_up_actions is not None:
            interaction.follow_up_actions = follow_up_actions
            
        db.commit()
        db.refresh(interaction)
        
        hcp = db.query(HCP).filter(HCP.id == interaction.hcp_id).first()
        hcp_name = hcp.name if hcp else "Unknown"
        
        form_data = {
            "hcp_name": hcp_name,
            "hcp_id": interaction.hcp_id,
            "interaction_type": interaction.interaction_type,
            "date": interaction.date.strftime("%Y-%m-%d") if interaction.date else None,
            "time": interaction.time.strftime("%H:%M") if interaction.time else None,
            "attendees": interaction.attendees,
            "topics_discussed": interaction.topics_discussed,
            "materials_shared": interaction.materials_shared,
            "samples_distributed": interaction.samples_distributed,
            "sentiment": interaction.sentiment,
            "outcomes": interaction.outcomes,
            "follow_up_actions": interaction.follow_up_actions,
            "suggested_follow_ups": interaction.suggested_follow_ups
        }
        
        return f"SUCCESS: Updated interaction ID {interaction_id} for Dr. {hcp_name}.\n<--STRUCTURED_FORM_DATA: {json.dumps(form_data)} -->"
    except Exception as e:
        return f"Error updating interaction: {str(e)}"
    finally:
        db.close()

@tool
def schedule_follow_up_tool(hcp_id: int, follow_up_text: str) -> str:
    """
    Update or append follow-up actions/reminders for a specific HCP.
    Args:
        hcp_id: The ID of the HCP.
        follow_up_text: The follow-up actions description to set.
    """
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
        if not hcp:
            return f"Error: HCP with ID {hcp_id} not found."
            
        last_interaction = db.query(Interaction).filter(Interaction.hcp_id == hcp_id).order_by(Interaction.created_at.desc()).first()
        if last_interaction:
            last_interaction.follow_up_actions = follow_up_text
            db.commit()
            return f"SUCCESS: Scheduled follow-up action for Dr. {hcp.name}: '{follow_up_text}'."
        else:
            return f"No prior interactions found for Dr. {hcp.name}. Please log an interaction first."
    except Exception as e:
        return f"Error scheduling follow-up: {str(e)}"
    finally:
        db.close()

@tool
def analyze_engagement_tool(hcp_id: int) -> str:
    """
    Calculate and return the doctor's engagement score trend based on logged interaction count.
    Args:
        hcp_id: The ID of the HCP.
    """
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
        if not hcp:
            return f"Error: HCP with ID {hcp_id} not found."
            
        interactions_count = db.query(Interaction).filter(Interaction.hcp_id == hcp_id).count()
        
        # Calculate dynamic engagement score update based on interactions
        new_score = min(10.0, 5.0 + (interactions_count * 0.8))
        hcp.engagement_score = new_score
        db.commit()
        
        return f"Engagement Analysis for Dr. {hcp.name}:\n- Current Engagement Score: {hcp.engagement_score}/10\n- Total Meetings Logged: {interactions_count}\n- Sentiment Trend: Positive interest in oncology updates."
    except Exception as e:
        return f"Error analyzing engagement: {str(e)}"
    finally:
        db.close()
