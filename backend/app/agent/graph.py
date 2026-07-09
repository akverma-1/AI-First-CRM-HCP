import operator
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode
from app.config import settings
from app.agent.tools import (
    get_hcp_profile_tool, 
    log_interaction_tool, 
    edit_interaction_tool, 
    schedule_follow_up_tool, 
    analyze_engagement_tool
)

# 1. Define Agent State
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

# 2. Register tools
tools = [
    get_hcp_profile_tool,
    log_interaction_tool,
    edit_interaction_tool,
    schedule_follow_up_tool,
    analyze_engagement_tool
]

# Create tool executor node
tool_node = ToolNode(tools)

# 3. Bind tools to the ChatOpenAI model
# Note: uses settings.openai_api_key loaded from config
llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=settings.openai_api_key,
    temperature=0.1
).bind_tools(tools)

# 4. Define agent node
def agent_node(state: AgentState):
    messages = state["messages"]
    
    system_prompt = """You are a helpful pharmaceutical sales CRM assistant.
You help sales representatives manage their interactions with Healthcare Professionals (HCPs) in the database.
You have access to 5 tools that interact directly with the local MySQL database:
1. `get_hcp_profile_tool`: Retrieve doctor details (ID, specialty, institution) by name.
2. `log_interaction_tool`: Save a new meeting/interaction record. IMPORTANT: This requires an `hcp_id`. Always look up the HCP first by name to get the correct ID, then log!
3. `edit_interaction_tool`: Modify an existing log details.
4. `schedule_follow_up_tool`: Set or schedule tasks for a doctor.
5. `analyze_engagement_tool`: Review the doctor's engagement score trend.

Guidelines:
- If the representative describes a meeting, always search/verify the doctor's name first using `get_hcp_profile_tool` to find their ID.
- Once you have the ID, invoke `log_interaction_tool` to save it to MySQL.
- Keep your conversational answers concise, professional, and clear.
"""
    
    # Prepend the system prompt for guidance
    full_messages = [SystemMessage(content=system_prompt)] + list(messages)
    response = llm.invoke(full_messages)
    
    return {"messages": [response]}

# 5. Define routing condition
def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    
    # If the LLM returned a tool call, execute it
    if last_message.tool_calls:
        return "tools"
    # Otherwise, end the conversation run
    return "__end__"

# 6. Build the StateGraph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)

# Set entry point
workflow.set_entry_point("agent")

# Add conditional edges
workflow.add_conditional_edges(
    "agent",
    should_continue,
)

# Add edge from tools back to agent
workflow.add_edge("tools", "agent")

# Compile graph
app_graph = workflow.compile()
