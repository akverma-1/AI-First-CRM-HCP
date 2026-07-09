from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import re
import json
from datetime import datetime
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from app.agent.graph import app_graph
from app.schemas import AIParseResponse

router = APIRouter(prefix="/api/agent", tags=["LangGraph Agent"])

class AgentChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class AgentChatResponse(BaseModel):
    reply: str
    structured_data: Optional[Dict[str, Any]] = None

@router.post("/chat", response_model=AgentChatResponse)
def agent_chat(request: AgentChatRequest):
    # 1. Reconstruct message history from frontend
    messages = []
    for msg in request.history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))
            
    # Add new user message
    messages.append(HumanMessage(content=request.message))
    
    try:
        # 2. Invoke LangGraph agent graph
        final_state = app_graph.invoke({"messages": messages})
        
        # 3. Extract final assistant response
        agent_reply = "I completed the request."
        for msg in reversed(final_state["messages"]):
            if isinstance(msg, AIMessage) and msg.content:
                agent_reply = msg.content
                break
                
        # 4. Scan tool messages for structured form data
        structured_data = None
        for msg in reversed(final_state["messages"]):
            if isinstance(msg, ToolMessage):
                match = re.search(r'<--STRUCTURED_FORM_DATA:\s*(.*?)\s*-->', msg.content)
                if match:
                    try:
                        structured_data = json.loads(match.group(1))
                        break
                    except Exception:
                        pass
                        
        return AgentChatResponse(
            reply=agent_reply,
            structured_data=structured_data
        )
        
    except Exception as e:
        print(f"LangGraph Agent invocation failed: {e}. Falling back to local heuristic parser...")
        
        # Heuristic fallback parser
        text = request.message
        text_lower = text.lower()
        
        # Extract HCP name
        hcp_name = None
        for name in ["Priya Sharma", "Rajesh Gupta", "Amit Patel", "Anjali Nair", "Suresh Kumar"]:
            if name.lower() in text_lower:
                hcp_name = name
                break
        if not hcp_name:
            match = re.search(r'(?:dr\.?|doctor)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2})', text, re.IGNORECASE)
            if match:
                hcp_name = match.group(1).strip().title()
            else:
                match = re.search(r'(?:met|visited|called|meeting\s+with)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2})', text, re.IGNORECASE)
                if match:
                    hcp_name = match.group(1).strip().title()
                else:
                    hcp_name = "Priya Sharma"

        # Match fields
        interaction_type = "Meeting"
        for t in ["Meeting", "Phone Call", "Video Call", "Email", "Conference", "Webinar"]:
            if t.lower() in text_lower:
                interaction_type = t
                break
                
        sentiment = "Neutral"
        if any(w in text_lower for w in ["positive", "great", "happy", "good", "nice"]):
            sentiment = "Positive"
        elif any(w in text_lower for w in ["negative", "bad", "concerned", "angry"]):
            sentiment = "Negative"
            
        materials_shared = []
        if "brochure" in text_lower:
            materials_shared.append("OncoBoost Product Brochure")
        if "pdf" in text_lower or "trial" in text_lower:
            materials_shared.append("Clinical Trials Phase III PDF")
        if not materials_shared:
            materials_shared.append("Product Information Guide")

        samples_distributed = []
        if "sample" in text_lower:
            samples_distributed.append("Product X 5mg Samples (2 qty)")
        else:
            samples_distributed.append("Product X Samples (2 qty)")
            
        topics_discussed = "Discussed oncology guidelines and safety profiles."
        topics_list = [
            ("oncology", "Discussed oncology updates and safety profiles."),
            ("cardiology", "Discussed cardiology updates and clinical trials."),
            ("neurology", "Discussed neurology diagnostics and patient feedback."),
            ("endocrinology", "Discussed endocrine therapies and dosage recommendations."),
            ("efficacy", "Discussed safety profiles, product efficacy, and long-term trials.")
        ]
        for keyword, desc in topics_list:
            if keyword in text_lower:
                topics_discussed = desc
                break

        follow_up_actions = "Follow up with the doctor next week."
        if "tuesday" in text_lower:
            follow_up_actions = "Follow up with the doctor next Tuesday."
        elif "week" in text_lower:
            follow_up_actions = "Follow up next week."

        mock_structured_data = {
            "hcp_name": hcp_name,
            "interaction_type": interaction_type,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "time": datetime.now().strftime("%H:%M"),
            "attendees": [hcp_name] if hcp_name else [],
            "topics_discussed": topics_discussed,
            "materials_shared": materials_shared,
            "samples_distributed": samples_distributed,
            "sentiment": sentiment,
            "outcomes": "Doctor requested detailed clinical literature.",
            "follow_up_actions": follow_up_actions,
            "suggested_follow_ups": [
                "Schedule follow-up meeting in 2 weeks",
                "Send OncoBoost Phase III PDF",
                "Add Dr. Sharma to advisory board invite list"
            ]
        }

        fallback_reply = f"""[Heuristic Fallback Node] I have parsed your notes locally:
- HCP Detected: Dr. {hcp_name}
- Type: {interaction_type}
- Sentiment: {sentiment}

Form fields on the left have been auto-populated. Please review and click 'Log Interaction' to save to MySQL."""

        return AgentChatResponse(
            reply=fallback_reply,
            structured_data=mock_structured_data
        )
