# AI-First HCP CRM — Log Interaction & Analytics System

This is a full-stack Customer Relationship Management (CRM) application designed for life science/pharmaceutical field representatives to log, edit, and analyze their meetings with Healthcare Professionals (HCPs). 

It features a **three-tabbed interactive interface**:
1. **📝 Log Interaction**: A dual-pane screen offering manual form entry alongside a stateful **LangGraph AI Assistant Chat** powered by OpenAI (`gpt-4o-mini`) to auto-populate form details in real-time.
2. **👥 HCP Directory**: A listing of all registered doctor profiles linked side-by-side with a detailed, chronological **Interaction Timeline** (meeting history, sentiments, materials/samples) and an **AI Next Best Action Recommendation** box.
3. **📊 Analytics Dashboard**: A visualization pane with aggregate summary statistics and custom-drawn **SVG Donut & Bar Charts** representing sentiment ratios and interaction channels.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite) with custom premium Vanilla CSS (Inter font, fully responsive).
- **Agent Framework**: LangGraph + LangChain.
- **Large Language Model (LLM)**: OpenAI API (`gpt-4o-mini`).
- **Database**: MySQL (SQLAlchemy ORM + PyMySQL).
- **Backend API**: FastAPI (Python).

---

## 📂 Project Structure

```
AI-First CRM HCP/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application entrypoint
│   │   ├── config.py        # Settings loader (loads .env)
│   │   ├── database.py      # SQLAlchemy engine & MySQL session setup
│   │   ├── models.py        # SQLAlchemy ORM models (HCP, Interaction)
│   │   ├── schemas.py       # Pydantic validation schemas
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── hcp.py        # Router for HCP profiles, history timeline, and next-action
│   │   │   ├── interaction.py# Router for interaction logging and dashboard statistics
│   │   │   └── agent.py      # Router for stateful LangGraph chat
│   │   └── agent/
│   │       ├── __init__.py
│   │       ├── graph.py      # Compiles StateGraph & LLM tool binding
│   │       └── tools.py      # Implements the 5 database tools
│   ├── .env                 # API keys and MySQL credentials
│   ├── requirements.txt     # Python backend dependencies
│   └── setup_db.py          # Auto-creates database schema and seeds sample doctors
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component (navigation tabs & panels)
│   │   ├── index.css        # Styles for logger form, chat bubbles, graphs, and timelines
│   │   └── main.jsx         # React DOM render entrypoint
│   ├── public/              # Public asset folder
│   ├── package.json         # NPM dependencies (React, Vite, Lucide Icons)
│   └── vite.config.js       # Vite configuration with backend proxy
└── README.md                # Project documentation (this file)
```

---

## 🚀 Setup & Installation

### Prerequisite
Ensure that your local **MySQL Server** is running.

### 1. Configure the Environment
Open [backend/.env](backend/.env) and update the configuration:
```env
# OpenAI API Key
OPENAI_API_KEY=sk-proj-...

# MySQL Connection String (URL-encode special characters like @ as %40)
DATABASE_URL=mysql+pymysql://root:Password%40123@localhost:3306/hcp_crm
```

### 2. Backend Setup
Activate a virtual environment and install the Python dependencies:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Initialize the database schema and seed the initial doctor profiles:
```bash
python setup_db.py
```
*(This will automatically connect to MySQL, create the `hcp_crm` database, set up tables, and seed 5 sample doctors).*

### 3. Frontend Setup
Open a separate terminal pane, navigate to the `frontend` folder, and install NPM dependencies:
```bash
cd frontend
npm install
```

---

## 💻 Running the Application

### Start the Backend Server (FastAPI)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --port 8000
```
- API Doc URL: [http://localhost:8000/docs](http://localhost:8000/docs)

### Start the Frontend Server (Vite)
```bash
cd frontend
npm run dev
```
- Web Application URL: [http://localhost:5173/](http://localhost:5173/)

---

## 🤖 LangGraph Agent & Bound Tools

The LangGraph StateGraph cycles state between the LLM agent and a standard tool node. The agent has access to **5 MySQL tools**:

1. **`get_hcp_profile_tool`**: Searches the database for doctor profiles by name and gets interaction metrics.
2. **`log_interaction_tool`**: Ingests parsed parameters and inserts a new log row into the `interactions` table.
3. **`edit_interaction_tool`**: Modifies topics, sentiment, outcomes, or follow-ups for a specific database log.
4. **`schedule_follow_up_tool`**: Modifies the follow-up reminder text of a doctor's latest interaction.
5. **`analyze_engagement_tool`**: Re-calculates and commits the doctor's engagement score dynamically in the DB.

### Graceful Fallback
If the OpenAI API key is missing or has exceeded its billing quota, the backend intercepts the query and runs a **local rule-based heuristic parser** to simulate the tool output and conversation message. This guarantees that form auto-populating works cleanly in all dev/demo environments.

---

## 🔬 Main Application Features

### 📝 Log Interaction Tab
- Autocomplete doctor lookup queries database suggestions in real time.
- Simulate voice dictation notes to parse and auto-populate form inputs.
- Send conversational summaries in the right-side chat assistant (runs stateful LangGraph workflow).

### 👥 HCP Directory Tab
- Lists all registered doctors, specialties, institutions, and their real-time engagement scores.
- Selecting any doctor fetches their **chronological meeting timeline** showing outcomes, follow-ups, sentiment indicators, materials shared, and starter packs distributed.
- Displays an **AI Next Best Action** card: uses OpenAI or rules to analyze history and recommend the most effective follow-up action for the representative.

### 📊 Analytics Dashboard Tab
- **KPI Indicators**: Renders counts of total doctors, total meetings logged, and average doctor engagement scores.
- **Sentiment Share (SVG Donut Chart)**: Visual circle segmented dynamically based on positive, neutral, and negative metrics.
- **Interaction Channels (SVG Bar Chart)**: Dynamic bar heights representing channels used (Video, Phone, Meetings, Emails).
- **Engagement Leaderboard**: Displays top engaged doctors with custom progress bar fills.

---

## 🧪 Verification & API Endpoints

You can verify the backend endpoints independently using curl:

- **Dashboard Statistics**:
  ```bash
  curl http://localhost:8000/api/interactions/stats/summary
  ```
- **HCP Timeline History**:
  ```bash
  curl http://localhost:8000/api/hcp/1/history
  ```
- **AI Next Best Action**:
  ```bash
  curl http://localhost:8000/api/hcp/1/next-action
  ```
