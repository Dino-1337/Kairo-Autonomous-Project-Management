from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.master_orchestrator import MasterOrchestrator
from agents.task_decomposer import TaskDecompositionAgent
from agents.assignment_engine import AssignmentEngine
from agents.slack_agent import SlackAgent

class ProcessRequest(BaseModel):
    user_request: str
    urgency: bool = False
    require_approval: bool = False
    deadline: str = "None"

class ConfirmAssignments(BaseModel):
    assignments: dict
    user_request: str

# Initialize everything
app = FastAPI(title="Startup Agent API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

print("🚀 Initializing Startup Agent...")
orchestrator = MasterOrchestrator()
task_agent = TaskDecompositionAgent()
assignment_engine = AssignmentEngine()
slack_agent = SlackAgent()
print("✅ All agents initialized!")

# Simple helper functions
def get_project_config():
    """Load project configuration"""
    try:
        import json
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'project_config.json')
        with open(config_path, 'r') as f:
            return json.load(f)
    except:
        return {"channel_name": "all-startup-test", "project_managers": [{"slack_id": "U09SN27BXNZ"}]}

def get_channel_id():
    """Get the project channel ID"""
    config = get_project_config()
    return slack_agent.find_channel_id(config.get("channel_name", "all-startup-test")) if slack_agent.client else None

def get_team_members(assignments):
    """Get all Slack IDs to notify"""
    members = set()
    
    # Add assigned team members
    if assignments and assignments.get('assignments'):
        for assignment in assignments['assignments']:
            if assignment.get('assignee_slack_id'):
                members.add(assignment['assignee_slack_id'])
    
    # Add project managers
    for pm in get_project_config().get('project_managers', []):
        if pm.get('slack_id'):
            members.add(pm['slack_id'])
    
    return list(members)

# API Routes
@app.get("/")
def root():
    channel_id = get_channel_id()
    return {
        "status": "🚀 Startup Agent API is running!",
        "slack_ready": slack_agent.client is not None,
        "channel_ready": channel_id is not None
    }

@app.get("/health")
def health():
    return {"status": "healthy", "slack_connected": slack_agent.client is not None}

@app.post("/process-request")
def process_request(request: ProcessRequest):
    """Process a user request through the full pipeline"""
    print(f"\n🎯 PROCESSING: '{request.user_request}'")
    print(f"   Urgency: {request.urgency}, Deadline: {request.deadline}")
    
    try:
        # Step 1: Route request
        routing = orchestrator.route_request(request.user_request)
        print(f"📡 Routed to: {routing['workflow']}")
        
        # Step 2: Decompose tasks with context
        context = {
            "urgency": request.urgency,
            "deadline": request.deadline,
            "require_approval": request.require_approval
        }
        decomposition = task_agent.decompose_request(request.user_request, context)
        if decomposition['status'] != 'success':
            return {"success": False, "error": "Task decomposition failed"}
        
        tasks = decomposition.get('tasks', [])
        print(f"🔄 Generated {len(tasks)} tasks")
        
        # Step 3: Assign to team
        assignments = assignment_engine.assign_tasks(tasks, request.user_request) if tasks else None
        print(f"👥 Assigned {assignments.get('total_tasks_assigned', 0) if assignments else 0} tasks")
        
        # Return response (NO Slack here)
        return {
            "success": True,
            "user_request": request.user_request,
            "summary": {
                "total_tasks": len(tasks),
                "assigned_tasks": assignments.get('total_tasks_assigned', 0) if assignments else 0,
                "project_id": datetime.now().strftime("%m%d%H%M")
            },
            "decomposition": decomposition,
            "assignments": assignments
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/confirm-assignments")
def confirm_assignments(data: ConfirmAssignments):
    """Send Slack notifications after user confirmation"""
    print(f"\n✅ CONFIRMING ASSIGNMENTS for: '{data.user_request}'")
    
    try:
        assignments = data.assignments
        slack_count = 0
        
        if slack_agent.client and assignments:
            channel_id = get_channel_id()
            project_name = data.user_request[:30] + "..." if len(data.user_request) > 30 else data.user_request
            
            # Post to channel if available
            if channel_id:
                task_list = "\n".join([f"• {a['task_title']} ({a['estimated_hours']}h) - {a['assignee']}" for a in assignments.get('assignments', [])])
                message = f"🎯 *New Project Confirmed*\n\n*{data.user_request}*\n\n{task_list}\n\nTeam members will receive DMs with their assignments. 🚀"
                slack_agent.post_channel_message(channel_id, message)
                print("📝 Posted to channel")
            
            # Send individual DMs
            for assignment in assignments.get('assignments', []):
                if slack_agent.send_task_assignment(assignment, project_name, channel_id):
                    slack_count += 1
            
            print(f"📨 Sent {slack_count} Slack notifications")
            
        return {"success": True, "slack_notifications": slack_count}
        
    except Exception as e:
        print(f"❌ Error sending notifications: {e}")
        return {"success": False, "error": str(e)}

# Start server
if __name__ == "__main__":
    import uvicorn
    channel_id = get_channel_id()
    
    print(f"\n{'🎯' * 20}")
    print("🚀 STARTUP AGENT API")
    print(f"{'🎯' * 20}")
    print("📍 http://localhost:8000")
    print("📚 http://localhost:8000/docs")
    print(f"🤖 Slack: {'✅' if slack_agent.client else '❌'}")
    print(f"📁 Channel: #{get_project_config().get('channel_name', 'all-startup-test')} {'✅' if channel_id else '❌'}")
    print(f"{'🎯' * 20}\n")
    
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)