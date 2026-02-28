import os
import sys
from typing import Any, Dict, TypedDict, Optional

from langgraph.graph import StateGraph, END

# Ensure we can import existing agents
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.master_orchestrator import MasterOrchestrator
from agents.task_decomposer import TaskDecompositionAgent
from agents.assignment_engine import AssignmentEngine


class WorkflowState(TypedDict, total=False):
    """Shared state for the LangGraph workflow."""

    user_request: str
    context: Dict[str, Any]
    routing: Dict[str, Any]
    decomposition: Dict[str, Any]
    assignments: Dict[str, Any]
    error: Optional[str]


orchestrator = MasterOrchestrator()
task_agent = TaskDecompositionAgent()
assignment_engine = AssignmentEngine()


def route_node(state: WorkflowState) -> WorkflowState:
    """Route the incoming request to a workflow."""
    user_request = state["user_request"]
    routing = orchestrator.route_request(user_request)
    new_state: WorkflowState = {**state, "routing": routing}
    return new_state


def decompose_node(state: WorkflowState) -> WorkflowState:
    """Decompose the request into tasks using the LLM-based agent."""
    user_request = state["user_request"]
    context = state.get("context", {})
    decomposition = task_agent.decompose_request(user_request, context)
    new_state: WorkflowState = {**state, "decomposition": decomposition}
    return new_state


def assign_node(state: WorkflowState) -> WorkflowState:
    """Assign tasks to team members (auto or manual placeholder)."""
    context = state.get("context", {})
    assignment_mode = context.get("assignment_mode", "auto")

    decomposition = state.get("decomposition") or {}
    tasks = decomposition.get("tasks", [])

    if not tasks:
        # Nothing to assign
        return {**state, "assignments": None}

    if assignment_mode == "manual":
        # Mirror existing manual-mode behavior (no auto assignment)
        assignments = {
            "status": "pending_manual",
            "assignments": [],
            "total_tasks_assigned": 0,
        }
    else:
        assignments = assignment_engine.assign_tasks(tasks, state.get("user_request", ""))

    new_state: WorkflowState = {**state, "assignments": assignments}
    return new_state


def build_workflow_graph():
    """Compile the LangGraph StateGraph representing the full workflow."""
    workflow = StateGraph(WorkflowState)

    workflow.add_node("route", route_node)
    workflow.add_node("decompose", decompose_node)
    workflow.add_node("assign", assign_node)

    workflow.set_entry_point("route")
    workflow.add_edge("route", "decompose")
    workflow.add_edge("decompose", "assign")
    workflow.add_edge("assign", END)

    return workflow.compile()


# Compiled graph application that FastAPI can call
workflow_app = build_workflow_graph()

