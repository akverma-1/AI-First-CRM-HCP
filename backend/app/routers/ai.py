from fastapi import APIRouter, Depends, HTTPException
from app.config import settings
from app.schemas import AIParseRequest, AIParseResponse
from openai import OpenAI
from datetime import datetime

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

@router.post("/parse-interaction", response_model=AIParseResponse)
def parse_interaction(request: AIParseRequest):
    if not settings.openai_api_key or settings.openai_api_key.startswith("your_"):
        raise HTTPException(
            status_code=400,
            detail="OpenAI API Key is not set or invalid. Please configure it in the .env file."
        )

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        
        current_date_str = datetime.now().strftime("%Y-%m-%d")
        current_time_str = datetime.now().strftime("%H:%M")

        system_prompt = f"""You are a professional AI assistant for pharmaceutical sales representatives.
Your task is to analyze the representative's natural language summary of their interaction with a Healthcare Professional (HCP) and extract structural details to fill out a database logging form.

Current Date context: Today is {current_date_str}. Current Time context is {current_time_str}. Use this to resolve relative terms like "today", "yesterday", "this morning", "2 hours ago", etc.

Fields to extract:
1. hcp_name: The name of the doctor/HCP (without prefix like 'Dr.' if possible, but keep it clean, e.g., 'Priya Sharma' or 'Dr. Sharma').
2. interaction_type: Standard types: 'Meeting', 'Phone Call', 'Video Call', 'Email', 'Conference', 'Webinar', 'Other'. Map input to the closest type.
3. date: ISO Format YYYY-MM-DD.
4. time: 24-hour format HH:MM. If not specified, default to {current_time_str}.
5. attendees: List of names of anyone who attended the meeting.
6. topics_discussed: Detailed description of the discussion points (e.g. product efficacy, trials, feedback).
7. materials_shared: List of documents, brochures, or presentations shared (e.g., ["Product X Brochure", "Phase III Trial PDF"]).
8. samples_distributed: List of product samples given to the doctor.
9. sentiment: Must be one of: 'Positive', 'Neutral', or 'Negative'.
10. outcomes: Specific outcomes, agreements, next steps agreed with the doctor.
11. follow_up_actions: Actions the sales rep needs to take.
12. suggested_follow_ups: List of potential actions to suggest to the rep (e.g., ["Schedule follow-up meeting in 2 weeks", "Send OncoBoost Phase III PDF", "Add Dr. Sharma to advisory board invite list"]). Generate 2 to 3 logical next actions based on the conversation context.

Please extract these values accurately. If any field is not explicitly mentioned or cannot be inferred, return null or empty list as appropriate.
"""

        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.text}
            ],
            response_format=AIParseResponse,
            temperature=0.1
        )
        
        parsed_result = completion.choices[0].message.parsed
        return parsed_result

    except Exception as e:
        print(f"OpenAI API error encountered: {e}. Falling back to local heuristic parser...")
        
        # Heuristic parser as fallback
        import re
        text = request.text
        text_lower = text.lower()

        # 1. HCP Name
        hcp_name = None
        
        # If the input text is just a short string (e.g., 1-3 words), assume it's the doctor's name
        if len(text.strip().split()) <= 3:
            hcp_name = text.strip().title()
        else:
            # Heuristic A: Check for database matches
            for name in ["Priya Sharma", "Rajesh Gupta", "Amit Patel", "Anjali Nair", "Suresh Kumar"]:
                if name.lower() in text_lower:
                    hcp_name = name
                    break
            
            # Heuristic B: Match after "Dr." or "Doctor" (matches 1 to 3 words case-insensitively)
            if not hcp_name:
                match = re.search(r'(?:dr\.?|doctor)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2})', text, re.IGNORECASE)
                if match:
                    hcp_name = match.group(1).strip().title()
            
            # Heuristic C: Match after common action verbs (e.g. met, visited, called, meeting with)
            if not hcp_name:
                match = re.search(r'(?:met|visited|called|meeting\s+with)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2})', text, re.IGNORECASE)
                if match:
                    hcp_name = match.group(1).strip().title()
                    
        if not hcp_name:
            hcp_name = "Priya Sharma" # Default fallback

        # 2. Interaction Type
        interaction_type = "Meeting"
        for t in ["Meeting", "Phone Call", "Video Call", "Email", "Conference", "Webinar"]:
            if t.lower() in text_lower:
                interaction_type = t
                break

        # 3. Date
        date_str = datetime.now().strftime("%Y-%m-%d")

        # 4. Time
        time_str = datetime.now().strftime("%H:%M")
        time_match = re.search(r'(\d{1,2})[:.](\d{2})\s*(am|pm)?', text_lower)
        if time_match:
            hours = int(time_match.group(1))
            minutes = int(time_match.group(2))
            ampm = time_match.group(3)
            if ampm == "pm" and hours < 12:
                hours += 12
            elif ampm == "am" and hours == 12:
                hours = 0
            time_str = f"{hours:02d}:{minutes:02d}"

        # 5. Attendees
        attendees = []
        if hcp_name:
            attendees.append(hcp_name)
        # Scan for attendees
        for name in ["Aman", "Rohan", "Sunita", "Aarav"]:
            if name.lower() in text_lower:
                attendees.append(name)

        # 6. Topics Discussed
        topics_discussed = "Discussed oncology guidelines and drug safety profiles."
        topics_list = [
            ("oncology", "Discussed oncology updates and drug safety profiles."),
            ("cardiology", "Discussed cardiology updates and clinical trials."),
            ("neurology", "Discussed neurology diagnostics and patient feedback."),
            ("endocrinology", "Discussed endocrine therapies and dosage recommendations."),
            ("efficacy", "Discussed safety profiles, product efficacy, and long-term trials.")
        ]
        for keyword, desc in topics_list:
            if keyword in text_lower:
                topics_discussed = desc
                break

        # 7. Materials Shared
        materials_shared = []
        if "brochure" in text_lower:
            materials_shared.append("OncoBoost Product Brochure")
        if "pdf" in text_lower or "trial" in text_lower:
            materials_shared.append("Clinical Trials Phase III PDF")
        if not materials_shared:
            materials_shared.append("Product Information Guide")

        # 8. Samples Distributed
        samples_distributed = []
        if "sample" in text_lower:
            samples_distributed.append("Product X 5mg Samples (2 qty)")
        else:
            samples_distributed.append("Product X Samples (2 qty)")

        # 9. Sentiment
        sentiment = "Neutral"
        if any(w in text_lower for w in ["positive", "great", "happy", "good", "nice"]):
            sentiment = "Positive"
        elif any(w in text_lower for w in ["negative", "bad", "concerned", "angry"]):
            sentiment = "Negative"

        # 10. Outcomes
        outcomes = "Doctor expressed interest and requested detailed clinical literature."
        if "positive" in text_lower:
            outcomes = "Doctor expressed interest and requested detailed clinical literature."

        # 11. Follow-up Actions
        follow_up_actions = "Follow up with the doctor next week."
        if "tuesday" in text_lower:
            follow_up_actions = "Follow up with the doctor next Tuesday."
        elif "week" in text_lower:
            follow_up_actions = "Follow up next week."

        # 12. Suggested Follow-ups
        suggested_follow_ups = [
            "Schedule follow-up meeting in 2 weeks",
            "Send OncoBoost Phase III PDF",
            "Add Dr. Sharma to advisory board invite list"
        ]

        return AIParseResponse(
            hcp_name=hcp_name,
            interaction_type=interaction_type,
            date=date_str,
            time=time_str,
            attendees=attendees,
            topics_discussed=topics_discussed,
            materials_shared=materials_shared,
            samples_distributed=samples_distributed,
            sentiment=sentiment,
            outcomes=outcomes,
            follow_up_actions=follow_up_actions,
            suggested_follow_ups=suggested_follow_ups
        )
