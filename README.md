<div align="center">
  <img src="assets/banner.png" alt="AI-First HCP CRM Banner" width="100%"/>
  
  <br/>
  <br/>

  ![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
  ![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
  ![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
  ![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
  ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)
  ![LangGraph](https://img.shields.io/badge/LangGraph-Agent-FF6B35?style=for-the-badge&logo=langchain&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)

  <br/>

  > **AI-powered CRM for Pharmaceutical Field Representatives to log, analyze, and act on HCP interactions — powered by LangGraph & OpenAI.**

  <br/>

  [![GitHub Stars](https://img.shields.io/github/stars/akverma-1/AI-First-CRM-HCP?style=social)](https://github.com/akverma-1/AI-First-CRM-HCP/stargazers)
  [![GitHub Forks](https://img.shields.io/github/forks/akverma-1/AI-First-CRM-HCP?style=social)](https://github.com/akverma-1/AI-First-CRM-HCP/network)
  [![GitHub Issues](https://img.shields.io/github/issues/akverma-1/AI-First-CRM-HCP)](https://github.com/akverma-1/AI-First-CRM-HCP/issues)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📌 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [🤖 LangGraph AI Agent](#-langgraph-ai-agent)
- [🔌 API Reference](#-api-reference)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

<table>
  <tr>
    <td>

### 📝 Log Interaction
- Real-time HCP autocomplete search
- AI Chat Assistant (LangGraph) auto-fills form fields from natural language
- Simulate voice dictation / field notes
- Track attendees, materials shared & samples distributed
- Sentiment tracking (Positive / Neutral / Negative)

</td>
    <td>

### 👥 HCP Directory
- Full doctor profile with specialty & institution
- Chronological **Interaction Timeline** per doctor
- Materials & samples distributed history
- **AI Next Best Action** recommendation card (OpenAI-powered)
- Real-time engagement scores

</td>
  </tr>
  <tr>
    <td>

### 📊 Analytics Dashboard
- Total HCPs & Interactions KPIs
- **SVG Donut Chart** — Sentiment distribution
- **SVG Bar Chart** — Interaction channel breakdown
- **Engagement Leaderboard** — Top performing doctors

</td>
    <td>

### 🔒 Security & Reliability
- `.env`-based secret management
- `.gitignore` prevents key leaks
- Graceful AI fallback — rule-based heuristics when OpenAI unavailable
- Auto-create HCP profile on first interaction log

</td>
  </tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Log Interact │  │ HCP Directory│  │  Analytics    │  │
│  │  + AI Chat   │  │  + Timeline  │  │  Dashboard    │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │   /api/* (Vite Proxy)               │
┌─────────▼─────────────────▼──────────────────▼──────────┐
│                   BACKEND (FastAPI)                       │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  /api/hcp  │  │/api/interact │  │  /api/agent/chat│  │
│  └────────────┘  └──────────────┘  └────────┬────────┘  │
│                                             │            │
│                                    ┌────────▼────────┐  │
│                                    │  LangGraph Agent │  │
│                                    │  (StateGraph +  │  │
│                                    │   5 DB Tools)   │  │
│                                    └────────┬────────┘  │
└─────────────────────────────────────────────┼───────────┘
                                              │
           ┌──────────────────┐   ┌───────────▼──────┐
           │   MySQL Database  │   │   OpenAI API     │
           │  (HCPs + Logs)   │   │  (gpt-4o-mini)   │
           └──────────────────┘   └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite 5 | SPA with hot reload |
| **Styling** | Vanilla CSS (Inter font) | Premium responsive UI |
| **Icons** | Lucide React | Consistent icon set |
| **Backend** | FastAPI (Python 3.11+) | REST API server |
| **AI Agent** | LangGraph + LangChain | Stateful conversation graph |
| **LLM** | OpenAI `gpt-4o-mini` | Natural language parsing |
| **ORM** | SQLAlchemy + PyMySQL | MySQL abstraction |
| **Database** | MySQL 8.0+ | Persistent data storage |
| **Dev Server** | Uvicorn | ASGI server |

---

## 📂 Project Structure

```
AI-First CRM HCP/
├── 📁 assets/                  # Project images & banner
├── 📁 backend/
│   ├── 📁 app/
│   │   ├── main.py             # FastAPI app entrypoint
│   │   ├── config.py           # Settings loader (.env)
│   │   ├── database.py         # SQLAlchemy MySQL session
│   │   ├── models.py           # ORM models: HCP, Interaction
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   ├── 📁 routers/
│   │   │   ├── hcp.py          # HCP profiles, timeline, next-action
│   │   │   ├── interaction.py  # Interaction logging + analytics stats
│   │   │   └── agent.py        # LangGraph chat endpoint
│   │   └── 📁 agent/
│   │       ├── graph.py        # LangGraph StateGraph compiler
│   │       └── tools.py        # 5 MySQL-backed AI tools
│   ├── .env.example            # ← Copy this to .env and fill in keys
│   ├── requirements.txt        # Python dependencies
│   └── setup_db.py             # DB schema init + sample data seeder
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── App.jsx             # Main component (all 3 tabs)
│   │   ├── index.css           # Premium design system styles
│   │   └── main.jsx            # React DOM entry
│   ├── package.json
│   └── vite.config.js          # Dev proxy → :8000
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0+ (running locally)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/akverma-1/AI-First-CRM-HCP.git
cd AI-First-CRM-HCP
```

### 2️⃣ Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Update with your MySQL credentials
DATABASE_URL=mysql+pymysql://root:YourPassword%40123@localhost:3306/hcp_crm
```

### 3️⃣ Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Initialize DB + seed 5 sample doctors
python setup_db.py
```

### 4️⃣ Frontend Setup

```bash
cd frontend
npm install
```

### 5️⃣ Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

| Service | URL |
|---------|-----|
| 🌐 Web App | http://localhost:5173 |
| 📖 API Docs | http://localhost:8000/docs |

---

## 🤖 LangGraph AI Agent

The LangGraph `StateGraph` routes conversation between the LLM and a tool node. The agent has **5 MySQL-backed tools**:

| Tool | Description |
|------|-------------|
| `get_hcp_profile_tool` | Search doctor profiles by name, fetch interaction metrics |
| `log_interaction_tool` | Parse natural language → insert new interaction row |
| `edit_interaction_tool` | Update topics, sentiment, outcomes for existing log |
| `schedule_follow_up_tool` | Modify follow-up reminder on doctor's latest interaction |
| `analyze_engagement_tool` | Recalculate & persist doctor engagement score |

### Graceful Fallback
> If OpenAI API is unavailable or quota is exceeded, the backend falls back to a **local rule-based heuristic parser** — ensuring the app works in all demo/dev environments.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hcp/` | List all HCP profiles |
| `POST` | `/api/hcp/` | Create a new HCP profile |
| `GET` | `/api/hcp/{id}/history` | Get interaction timeline for an HCP |
| `GET` | `/api/hcp/{id}/next-action` | AI-generated next best action |
| `POST` | `/api/interactions/` | Log a new interaction |
| `GET` | `/api/interactions/stats/summary` | Analytics dashboard data |
| `POST` | `/api/agent/chat` | Chat with LangGraph AI agent |

### Quick Verify

```bash
# Dashboard stats
curl http://localhost:8000/api/interactions/stats/summary

# Doctor timeline
curl http://localhost:8000/api/hcp/1/history

# AI Next Best Action
curl http://localhost:8000/api/hcp/1/next-action
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Built with ❤️ using FastAPI + LangGraph + React</strong>
  <br/>
  <sub>⭐ Star this repo if you found it useful!</sub>
</div>
