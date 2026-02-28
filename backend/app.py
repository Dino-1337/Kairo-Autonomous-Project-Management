from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select
import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.slack_agent import SlackAgent
from graph.workflow import workflow_app
from database import init_db, get_session
from project_models import (
    Project,
    ProjectCreate,
    ProjectRead,
    Idea,
    IdeaCreate,
    IdeaRead,
    Task,
    TaskRead,
    TaskUpdate,
    MeetingNote,
    MeetingNoteCreate,
    MeetingNoteRead,
    ProjectEvent,
    ProjectEventRead,
)

class ProcessRequest(BaseModel):
    user_request: str
    urgency: bool = False
    require_approval: bool = False
    deadline: str = "None"
    assignment_mode: str = "auto"  # "auto" or "manual"

class ConfirmAssignments(BaseModel):
    assignments: dict
    user_request: str

class ManualAssignment(BaseModel):
    tasks: list  # [{task_id, assignee_name, assignee_slack_id}]
    decomposition: dict  # Full decomposition object with tasks

# Initialize everything
app = FastAPI(title="Startup Agent API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

print(" Initializing Startup Agent...")
init_db()
slack_agent = SlackAgent()
print(" Core agents (Slack + LangGraph workflow + database) initialized!")

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
        "status": " Startup Agent API is running!",
        "slack_ready": slack_agent.client is not None,
        "channel_ready": channel_id is not None,
    }


@app.get("/health")
def health():
    return {"status": "healthy", "slack_connected": slack_agent.client is not None}


# ---------------------------------------------------------------------------
# Project-centric API (projects, ideas, tasks, meeting notes, timeline)
# ---------------------------------------------------------------------------


@app.post("/projects", response_model=ProjectRead)
def create_project(project: ProjectCreate, session: Session = Depends(get_session)):
    db_project = Project.model_validate(project)
    session.add(db_project)
    session.commit()
    session.refresh(db_project)

    event = ProjectEvent(
        project_id=db_project.id,
        type="project_created",
        payload={"name": db_project.name},
    )
    session.add(event)
    session.commit()

    return db_project


@app.get("/projects", response_model=list[ProjectRead])
def list_projects(session: Session = Depends(get_session)):
    projects = session.exec(select(Project)).all()
    return projects


@app.get("/projects/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


class IdeaWithTasksResponse(BaseModel):
    idea: IdeaRead
    tasks: list[TaskRead]


@app.post("/projects/{project_id}/ideas", response_model=IdeaWithTasksResponse)
def add_idea_to_project(
    project_id: int,
    idea_in: IdeaCreate,
    session: Session = Depends(get_session),
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_idea = Idea(project_id=project_id, text=idea_in.text, source=idea_in.source)
    session.add(db_idea)
    session.commit()
    session.refresh(db_idea)

    # Run LangGraph workflow to generate tasks + assignments
    context = {
        "urgency": idea_in.urgency,
        "deadline": idea_in.deadline,
        "require_approval": idea_in.require_approval,
        "assignment_mode": idea_in.assignment_mode,
    }
    initial_state = {"user_request": db_idea.text, "context": context}
    final_state = workflow_app.invoke(initial_state)

    decomposition = final_state.get("decomposition", {}) or {}
    assignments = final_state.get("assignments") or {}
    tasks_data = decomposition.get("tasks", []) if isinstance(decomposition, dict) else []

    created_tasks: list[Task] = []
    for t in tasks_data:
        db_task = Task(
            project_id=project_id,
            idea_id=db_idea.id,
            title=t.get("title", ""),
            description=t.get("description", ""),
            estimated_hours=t.get("estimated_hours"),
            skills_required=t.get("skills_required", []),
            depends_on_ids=t.get("depends_on", []),
        )
        # If assignments available, try to match by title
        if assignments and assignments.get("assignments"):
            for a in assignments["assignments"]:
                if a.get("task_title") == db_task.title:
                    db_task.assignee = a.get("assignee")
                    db_task.assignee_slack_id = a.get("assignee_slack_id")
                    break

        session.add(db_task)
        created_tasks.append(db_task)

    session.commit()
    for db_task in created_tasks:
        session.refresh(db_task)

    # Events for history
    idea_event = ProjectEvent(
        project_id=project_id,
        type="idea_added",
        payload={"idea_id": db_idea.id, "text": db_idea.text, "source": db_idea.source},
    )
    tasks_event = ProjectEvent(
        project_id=project_id,
        type="tasks_generated",
        payload={
            "idea_id": db_idea.id,
            "task_ids": [t.id for t in created_tasks],
        },
    )
    session.add(idea_event)
    session.add(tasks_event)
    session.commit()

    return IdeaWithTasksResponse(
        idea=IdeaRead.model_validate(db_idea),
        tasks=[TaskRead.model_validate(t) for t in created_tasks],
    )


@app.get("/projects/{project_id}/tasks", response_model=list[TaskRead])
def list_project_tasks(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = session.exec(select(Task).where(Task.project_id == project_id)).all()
    return tasks


@app.get("/projects/{project_id}/ideas", response_model=list[IdeaRead])
def list_project_ideas(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ideas = session.exec(
        select(Idea).where(Idea.project_id == project_id).order_by(Idea.created_at)
    ).all()
    return [IdeaRead.model_validate(i) for i in ideas]


@app.get("/projects/{project_id}/meeting-notes", response_model=list[MeetingNoteRead])
def list_meeting_notes(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    notes = session.exec(
        select(MeetingNote)
        .where(MeetingNote.project_id == project_id)
        .order_by(MeetingNote.meeting_date.desc(), MeetingNote.created_at.desc())
    ).all()
    return [MeetingNoteRead.model_validate(n) for n in notes]


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(task)
    session.commit()


@app.delete("/projects/{project_id}/ideas/{idea_id}", status_code=204)
def delete_idea(project_id: int, idea_id: int, session: Session = Depends(get_session)):
    idea = session.get(Idea, idea_id)
    if not idea or idea.project_id != project_id:
        raise HTTPException(status_code=404, detail="Idea not found")
    # Delete associated tasks first
    tasks = session.exec(select(Task).where(Task.idea_id == idea_id)).all()
    for t in tasks:
        session.delete(t)
    session.delete(idea)
    session.commit()




@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, patch: TaskUpdate, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    original_status = task.status

    update_data = patch.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    if "status" in update_data and update_data["status"] != original_status:
        event = ProjectEvent(
            project_id=task.project_id,
            type="task_status_changed",
            payload={
                "task_id": task.id,
                "from": original_status,
                "to": task.status,
            },
        )
        session.add(event)
        session.commit()

    return TaskRead.model_validate(task)


@app.post("/projects/{project_id}/meeting-notes", response_model=MeetingNoteRead)
def add_meeting_note(
    project_id: int,
    note_in: MeetingNoteCreate,
    session: Session = Depends(get_session),
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_note = MeetingNote(project_id=project_id, **note_in.dict())
    session.add(db_note)
    session.commit()
    session.refresh(db_note)

    event = ProjectEvent(
        project_id=project_id,
        type="meeting_note_added",
        payload={
            "note_id": db_note.id,
            "meeting_date": str(db_note.meeting_date) if db_note.meeting_date else None,
        },
    )
    session.add(event)
    session.commit()

    return MeetingNoteRead.model_validate(db_note)


@app.get("/projects/{project_id}/events", response_model=list[ProjectEventRead])
def get_project_events(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    events = (
        session.exec(
            select(ProjectEvent)
            .where(ProjectEvent.project_id == project_id)
            .order_by(ProjectEvent.created_at)
        )
        .all()
    )
    return [ProjectEventRead.model_validate(e) for e in events]

@app.post("/process-request")
def process_request(request: ProcessRequest):
    """Process a user request through the full pipeline"""
    print(f"\n PROCESSING: '{request.user_request}'")
    print(f"   Urgency: {request.urgency}, Deadline: {request.deadline}")
    
    try:
        # Build initial LangGraph state
        context = {
            "urgency": request.urgency,
            "deadline": request.deadline,
            "require_approval": request.require_approval,
            "assignment_mode": request.assignment_mode,
        }

        initial_state = {
            "user_request": request.user_request,
            "context": context,
        }

        # Run through LangGraph workflow
        final_state = workflow_app.invoke(initial_state)

        decomposition = final_state.get("decomposition", {})
        assignments = final_state.get("assignments")
        tasks = decomposition.get("tasks", []) if isinstance(decomposition, dict) else []

        if decomposition.get("status") != "success":
            return {"success": False, "error": "Task decomposition failed"}

        # Return response (NO Slack here)
        return {
            "success": True,
            "user_request": request.user_request,
            "assignment_mode": request.assignment_mode,
            "summary": {
                "total_tasks": len(tasks),
                "assigned_tasks": assignments.get("total_tasks_assigned", 0) if assignments else 0,
                "project_id": datetime.now().strftime("%m%d%H%M"),
            },
            "decomposition": decomposition,
            "assignments": assignments,
        }

    except Exception as e:
        print(f" Error: {e}")
        return {"success": False, "error": str(e)}

@app.get("/get-online-employees")
def get_online_employees():
    """Get list of online team members from Slack"""
    try:
        employees = slack_agent.get_online_employees()
        return {
            "success": True,
            "employees": employees
        }
    except Exception as e:
        print(f" Error getting online employees: {e}")
        return {"success": False, "error": str(e), "employees": []}

@app.post("/assign-tasks-manually")
def assign_tasks_manually(data: ManualAssignment):
    """Accept manual task assignments and format them for confirmation"""
    try:
        tasks = data.decomposition.get('tasks', [])
        manual_assignments = data.tasks
        
        # Create a mapping of task_id to task details
        task_map = {str(task['id']): task for task in tasks}
        
        # Format assignments to match expected structure
        formatted_assignments = []
        for manual_assignment in manual_assignments:
            task_id = str(manual_assignment.get('task_id'))
            task = task_map.get(task_id)
            
            if not task:
                print(f"️  Task {task_id} not found in decomposition")
                continue
            
            # Find team member details
            assignee_name = manual_assignment.get('assignee_name')
            assignee_slack_id = manual_assignment.get('assignee_slack_id')
            
            assignment_detail = {
                'task_id': task_id,
                'task_title': task.get('title', ''),
                'assignee': assignee_name,
                'assignee_slack_id': assignee_slack_id,
                'reason': 'Manually assigned',
                'skills': task.get('skills_required', []),
                'estimated_hours': task.get('estimated_hours', 0)
            }
            
            formatted_assignments.append(assignment_detail)
            print(f" Formatted manual assignment: {task.get('title')} -> {assignee_name}")
        
        return {
            "success": True,
            "assignments": {
                'status': 'success',
                'assignments': formatted_assignments,
                'total_tasks_assigned': len(formatted_assignments)
            }
        }
        
    except Exception as e:
        print(f" Error formatting manual assignments: {e}")
        return {"success": False, "error": str(e)}

@app.post("/confirm-assignments")
def confirm_assignments(data: ConfirmAssignments):
    """Send Slack notifications after user confirmation"""
    print(f"\n CONFIRMING ASSIGNMENTS for: '{data.user_request}'")
    
    try:
        assignments = data.assignments
        slack_count = 0
        
        if slack_agent.client and assignments:
            channel_id = get_channel_id()
            project_name = data.user_request[:30] + "..." if len(data.user_request) > 30 else data.user_request
            
            # Post to channel if available
            if channel_id:
                task_list = "\n".join([f"• {a['task_title']} ({a['estimated_hours']}h) - {a['assignee']}" for a in assignments.get('assignments', [])])
                message = f" *New Project Confirmed*\n\n*{data.user_request}*\n\n{task_list}\n\nTeam members will receive DMs with their assignments. "
                slack_agent.post_channel_message(channel_id, message)
                print(" Posted to channel")
            
            # Send individual DMs
            for assignment in assignments.get('assignments', []):
                if slack_agent.send_task_assignment(assignment, project_name, channel_id):
                    slack_count += 1
            
            print(f" Sent {slack_count} Slack notifications")
            
        return {"success": True, "slack_notifications": slack_count}
        
    except Exception as e:
        print(f" Error sending notifications: {e}")
        return {"success": False, "error": str(e)}

# Start server
if __name__ == "__main__":
    import uvicorn
    channel_id = get_channel_id()
    
    print(f"\n{'' * 20}")
    print(" STARTUP AGENT API")
    print(f"{'' * 20}")
    print(" http://localhost:8000")
    print(" http://localhost:8000/docs")
    print(f" Slack: {'' if slack_agent.client else ''}")
    print(f" Channel: #{get_project_config().get('channel_name', 'all-startup-test')} {'' if channel_id else ''}")
    print(f"{'' * 20}\n")
    
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)