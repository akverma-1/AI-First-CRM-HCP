from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import hcp, interaction, ai, agent

app = FastAPI(
    title="AI-First HCP CRM",
    description="Backend API for logging HCP interactions manually or via AI Assistant",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo / testing. Can be restricted to client URL if needed.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(hcp.router)
app.include_router(interaction.router)
app.include_router(ai.router)
app.include_router(agent.router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "AI-First HCP CRM Backend API",
        "version": "1.0.0"
    }
