from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlmodel import Session, select
import sys
import os
import jwt
import json
import shutil
from datetime import datetime, date, timedelta
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.slack_agent import SlackAgent
from graph.workflow import run_idea_pipeline
from idea_guardrails import validate_idea_text
from agents.contextual_progress import extract_meeting_insights, generate_progress_summary
from database import init_db, get_session
from project_models import (
    Project, ProjectCreate, ProjectRead,
    Idea, IdeaCreate, IdeaRead,
    Task, TaskCreate, TaskRead, TaskUpdate,
    Subtask, SubtaskCreate, SubtaskRead, SubtaskUpdate,
    Sprint, SprintCreate, SprintRead,
    Milestone, MilestoneCreate, MilestoneRead,
    Comment, CommentCreate, CommentRead,
    TaskHistory, TaskHistoryRead,
    TaskAttachment, TaskAttachmentCreate, TaskAttachmentRead,
    InAppNotification, NotificationRead,
    MeetingNote, MeetingNoteCreate, MeetingNoteRead,
    ProjectEvent, ProjectEventRead,
    ProjectStats,
)


class ProcessRequest(BaseModel):
    user_request: str
    urgency: bool = False
    require_approval: bool = False
    deadline: str = "None"
    assignment_mode: str = "auto"


class ConfirmAssignments(BaseModel):
    assignments: dict
    user_request: str


class ManualAssignment(BaseModel):
    tasks: list
    decomposition: dict


class IdeaDraftTaskItem(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = None
    estimated_hours: Optional[float] = None
    skills_required: list[str] = Field(default_factory=list)
    depends_on: list[int] = Field(default_factory=list)
    assignee: Optional[str] = None
    assignee_slack_id: Optional[str] = None


class IdeaConfirmBody(BaseModel):
    text: str
    source: str = "manual"
    urgency: bool = False
    deadline: str = "None"
    require_approval: bool = False
    assignment_mode: str = "auto"
    tasks: list[IdeaDraftTaskItem] = Field(default_factory=list)
    meeting_note_id: Optional[int] = None


class IdeaPreviewResponse(BaseModel):
    decomposition: dict
    assignments: Optional[dict] = None


class ProgressSummaryResponse(BaseModel):
    summary: str


# Initialize app
app = FastAPI(title="Kairo Project Manager API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

print(" Initializing Kairo API...")
init_db()
slack_agent = SlackAgent()
print(" Initialized!")


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def get_current_user(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_project_or_404(project_id: int, user_id: str, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def record_task_history(task_id: int, field: str, old_val, new_val, user_id: str, session: Session):
    if str(old_val) != str(new_val):
        entry = TaskHistory(
            task_id=task_id,
            field=field,
            old_value=str(old_val) if old_val is not None else None,
            new_value=str(new_val) if new_val is not None else None,
            changed_by=user_id,
        )
        session.add(entry)


def push_notification(user_id: str, notif_type: str, payload: dict, session: Session):
    notif = InAppNotification(user_id=user_id, type=notif_type, payload=payload)
    session.add(notif)


DEADLINE_TO_DAYS = {
    "Urgent (24h)": 1,
    "3 Days": 3,
    "1 Week": 7,
    "2 Weeks": 14,
}


def due_date_from_deadline_option(deadline: Optional[str]) -> Optional[date]:
    if not deadline or deadline in ("None", "none", ""):
        return None
    days = DEADLINE_TO_DAYS.get(deadline)
    if days is None:
        return None
    return date.today() + timedelta(days=days)


def priority_from_idea_context(urgency: bool, deadline: Optional[str]) -> str:
    has_deadline = bool(deadline and deadline not in ("None", "none", ""))
    if urgency and has_deadline and deadline == "Urgent (24h)":
        return "critical"
    if urgency:
        return "high"
    if has_deadline:
        return "high"
    return "medium"


def _persist_tasks_for_idea(
    session: Session,
    project_id: int,
    idea_id: int,
    tasks_data: list[dict],
    idea_priority: str,
    idea_due: Optional[date],
) -> list[Task]:
    """Insert tasks; remap depends_on from draft LLM ids to new DB task ids."""
    sorted_rows = sorted(tasks_data, key=lambda t: t.get("id") if t.get("id") is not None else 0)
    id_map: dict[int, int] = {}
    created: list[Task] = []
    for t in sorted_rows:
        db_task = Task(
            project_id=project_id,
            idea_id=idea_id,
            title=t.get("title", ""),
            description=t.get("description"),
            estimated_hours=t.get("estimated_hours"),
            skills_required=t.get("skills_required") or [],
            depends_on_ids=[],
            priority=idea_priority,
            due_date=idea_due,
            assignee=t.get("assignee"),
            assignee_slack_id=t.get("assignee_slack_id"),
        )
        session.add(db_task)
        session.flush()
        oid = t.get("id")
        if oid is not None:
            try:
                id_map[int(oid)] = db_task.id
            except (TypeError, ValueError):
                pass
        created.append(db_task)

    for db_task, t in zip(created, sorted_rows):
        deps = t.get("depends_on") or []
        resolved: list[int] = []
        for d in deps:
            try:
                di = int(d)
                if di in id_map:
                    resolved.append(id_map[di])
            except (TypeError, ValueError):
                continue
        db_task.depends_on_ids = resolved
        session.add(db_task)
    return created


def move_overdue_open_tasks_to_backlog(project_id: int, session: Session) -> None:
    """Non-done tasks past due_date move to backlog (Kanban backlog column)."""
    today = date.today()
    open_statuses = ("todo", "in_progress", "in_review", "blocked")
    tasks = session.exec(select(Task).where(Task.project_id == project_id)).all()
    changed = False
    for t in tasks:
        if t.due_date and t.due_date < today and t.status in open_statuses:
            t.status = "backlog"
            t.updated_at = datetime.utcnow()
            session.add(t)
            changed = True
    if changed:
        session.commit()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "Kairo API v2 running", "slack_ready": slack_agent.client is not None}


@app.get("/health")
def health():
    return {"status": "healthy", "slack_connected": slack_agent.client is not None}


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

@app.post("/projects", response_model=ProjectRead)
def create_project(
    project: ProjectCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    db_project = Project.model_validate(project)
    db_project.user_id = user_id
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    event = ProjectEvent(project_id=db_project.id, type="project_created", payload={"name": db_project.name})
    session.add(event)
    session.commit()
    return db_project


@app.get("/projects", response_model=list[ProjectRead])
def list_projects(session: Session = Depends(get_session), user_id: str = Depends(get_current_user)):
    return session.exec(select(Project).where(Project.user_id == user_id)).all()


@app.get("/projects/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, session: Session = Depends(get_session), user_id: str = Depends(get_current_user)):
    return get_project_or_404(project_id, user_id, session)


@app.patch("/projects/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    updates: dict,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    project = get_project_or_404(project_id, user_id, session)
    for key, val in updates.items():
        if hasattr(project, key):
            setattr(project, key, val)
    project.updated_at = datetime.utcnow()
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@app.delete("/projects/{project_id}")
def delete_project(project_id: int, session: Session = Depends(get_session), user_id: str = Depends(get_current_user)):
    project = get_project_or_404(project_id, user_id, session)
    session.delete(project)
    session.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Project Stats (for Reports tab)
# ---------------------------------------------------------------------------

@app.get("/projects/{project_id}/stats", response_model=ProjectStats)
def get_project_stats(
    project_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    move_overdue_open_tasks_to_backlog(project_id, session)
    tasks = session.exec(select(Task).where(Task.project_id == project_id)).all()
    total = len(tasks)
    done = sum(1 for t in tasks if t.status == "done")

    by_status: dict = {}
    by_priority: dict = {}
    by_assignee: dict = {}
    for t in tasks:
        by_status[t.status] = by_status.get(t.status, 0) + 1
        by_priority[t.priority or "medium"] = by_priority.get(t.priority or "medium", 0) + 1
        if t.assignee:
            by_assignee[t.assignee] = by_assignee.get(t.assignee, 0) + 1

    week_ago = datetime.utcnow() - timedelta(days=7)
    completed_last_7 = sum(
        1 for t in tasks
        if t.status == "done" and t.updated_at and t.updated_at >= week_ago
    )

    today = date.today()
    overdue = sum(
        1 for t in tasks
        if t.due_date and t.due_date < today and t.status not in ("done",)
    )

    return ProjectStats(
        total_tasks=total,
        by_status=by_status,
        by_priority=by_priority,
        by_assignee=by_assignee,
        completed_last_7_days=completed_last_7,
        overdue_count=overdue,
        completion_percent=round((done / total * 100) if total else 0, 1),
    )


# ---------------------------------------------------------------------------
# Sprints
# ---------------------------------------------------------------------------

@app.post("/projects/{project_id}/sprints", response_model=SprintRead)
def create_sprint(
    project_id: int,
    sprint_in: SprintCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    sprint = Sprint(project_id=project_id, **sprint_in.model_dump())
    session.add(sprint)
    session.commit()
    session.refresh(sprint)
    return sprint


@app.get("/projects/{project_id}/sprints", response_model=list[SprintRead])
def list_sprints(
    project_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    return session.exec(select(Sprint).where(Sprint.project_id == project_id)).all()


@app.patch("/sprints/{sprint_id}", response_model=SprintRead)
def update_sprint(
    sprint_id: int,
    updates: SprintCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    sprint = session.get(Sprint, sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    get_project_or_404(sprint.project_id, user_id, session)
    for key, val in updates.model_dump(exclude_unset=True).items():
        setattr(sprint, key, val)
    session.add(sprint)
    session.commit()
    session.refresh(sprint)
    return sprint


@app.delete("/sprints/{sprint_id}", status_code=204)
def delete_sprint(sprint_id: int, session: Session = Depends(get_session), user_id: str = Depends(get_current_user)):
    sprint = session.get(Sprint, sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    get_project_or_404(sprint.project_id, user_id, session)
    session.delete(sprint)
    session.commit()


# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------

@app.post("/projects/{project_id}/milestones", response_model=MilestoneRead)
def create_milestone(
    project_id: int,
    ms_in: MilestoneCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    ms = Milestone(project_id=project_id, **ms_in.model_dump())
    session.add(ms)
    session.commit()
    session.refresh(ms)
    return ms


@app.get("/projects/{project_id}/milestones", response_model=list[MilestoneRead])
def list_milestones(
    project_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    return session.exec(select(Milestone).where(Milestone.project_id == project_id)).all()


@app.patch("/milestones/{ms_id}", response_model=MilestoneRead)
def update_milestone(
    ms_id: int,
    updates: MilestoneCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    ms = session.get(Milestone, ms_id)
    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")
    get_project_or_404(ms.project_id, user_id, session)
    for key, val in updates.model_dump(exclude_unset=True).items():
        setattr(ms, key, val)
    session.add(ms)
    session.commit()
    session.refresh(ms)
    return ms


@app.delete("/milestones/{ms_id}", status_code=204)
def delete_milestone(ms_id: int, session: Session = Depends(get_session), user_id: str = Depends(get_current_user)):
    ms = session.get(Milestone, ms_id)
    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")
    get_project_or_404(ms.project_id, user_id, session)
    session.delete(ms)
    session.commit()


# ---------------------------------------------------------------------------
# Ideas
# ---------------------------------------------------------------------------

class IdeaWithTasksResponse(BaseModel):
    idea: IdeaRead
    tasks: list[TaskRead]


@app.post("/projects/{project_id}/ideas/preview", response_model=IdeaPreviewResponse)
def preview_idea_tasks(
    project_id: int,
    idea_in: IdeaCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    ok, reason = validate_idea_text(idea_in.text)
    if not ok:
        raise HTTPException(status_code=422, detail=reason)

    context = {
        "source": idea_in.source,
        "urgency": idea_in.urgency,
        "deadline": idea_in.deadline,
        "require_approval": idea_in.require_approval,
        "assignment_mode": idea_in.assignment_mode,
    }
    final_state = run_idea_pipeline(idea_in.text, context)
    decomposition = final_state.get("decomposition", {}) or {}
    if not isinstance(decomposition, dict):
        decomposition = {"status": "error", "tasks": [], "total_tasks": 0}
    assignments = final_state.get("assignments")
    return IdeaPreviewResponse(decomposition=decomposition, assignments=assignments)


@app.post("/projects/{project_id}/ideas/confirm", response_model=IdeaWithTasksResponse)
def confirm_idea_tasks(
    project_id: int,
    body: IdeaConfirmBody,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    ok, reason = validate_idea_text(body.text)
    if not ok:
        raise HTTPException(status_code=422, detail=reason)

    db_idea = Idea(project_id=project_id, text=body.text, source=body.source)
    session.add(db_idea)
    session.commit()
    session.refresh(db_idea)

    idea_due = due_date_from_deadline_option(body.deadline)
    idea_priority = priority_from_idea_context(body.urgency, body.deadline)

    tasks_payload = [t.model_dump() for t in body.tasks]
    created_tasks = _persist_tasks_for_idea(
        session, project_id, db_idea.id, tasks_payload, idea_priority, idea_due
    )

    session.commit()
    for db_task in created_tasks:
        session.refresh(db_task)

    session.add(ProjectEvent(
        project_id=project_id, type="idea_added",
        payload={"idea_id": db_idea.id, "text": db_idea.text, "source": db_idea.source},
    ))
    session.add(ProjectEvent(
        project_id=project_id, type="tasks_generated",
        payload={"idea_id": db_idea.id, "task_ids": [t.id for t in created_tasks]},
    ))

    if body.meeting_note_id is not None:
        note = session.get(MeetingNote, body.meeting_note_id)
        if note and note.project_id == project_id:
            blob = (note.summary or "") + "\n" + note.raw_text
            note.insights = extract_meeting_insights(blob)
            session.add(note)
            session.add(ProjectEvent(
                project_id=project_id,
                type="meeting_insights_captured",
                payload={"note_id": note.id, "preview": (note.summary or note.raw_text)[:160]},
            ))

    session.commit()

    return IdeaWithTasksResponse(
        idea=IdeaRead.model_validate(db_idea),
        tasks=[TaskRead.model_validate(t) for t in created_tasks],
    )


@app.get("/projects/{project_id}/progress-summary", response_model=ProgressSummaryResponse)
def get_project_progress_summary(
    project_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    project = get_project_or_404(project_id, user_id, session)
    ideas = session.exec(
        select(Idea).where(Idea.project_id == project_id).order_by(Idea.created_at.desc()).limit(12)
    ).all()
    tasks = session.exec(select(Task).where(Task.project_id == project_id)).all()
    notes = session.exec(
        select(MeetingNote).where(MeetingNote.project_id == project_id).order_by(MeetingNote.created_at.desc()).limit(8)
    ).all()
    events = session.exec(
        select(ProjectEvent).where(ProjectEvent.project_id == project_id).order_by(ProjectEvent.created_at.desc()).limit(25)
    ).all()

    ideas_lines = "\n".join(f"- {i.text[:200]}" for i in reversed(ideas))
    tasks_lines = "\n".join(f"- [{t.status}] {t.title}" for t in tasks[:40])
    notes_lines = []
    for n in notes:
        line = (n.summary or n.raw_text[:300]).replace("\n", " ")
        notes_lines.append(f"- {line}")
    notes_block = "\n".join(notes_lines)
    ev_lines = "\n".join(f"- {e.type}: {e.payload}" for e in reversed(events))

    summary = generate_progress_summary(project.name, ideas_lines, tasks_lines, notes_block, ev_lines)
    return ProgressSummaryResponse(summary=summary)


@app.get("/projects/{project_id}/ideas", response_model=list[IdeaRead])
def list_project_ideas(
    project_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    ideas = session.exec(
        select(Idea).where(Idea.project_id == project_id).order_by(Idea.created_at)
    ).all()
    return [IdeaRead.model_validate(i) for i in ideas]


@app.delete("/projects/{project_id}/ideas/{idea_id}", status_code=204)
def delete_idea(
    project_id: int,
    idea_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    idea = session.get(Idea, idea_id)
    if not idea or idea.project_id != project_id:
        raise HTTPException(status_code=404, detail="Idea not found")
    for t in session.exec(select(Task).where(Task.idea_id == idea_id)).all():
        session.delete(t)
    session.delete(idea)
    session.commit()


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@app.get("/projects/{project_id}/tasks", response_model=list[TaskRead])
def list_project_tasks(
    project_id: int,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None,
    sprint_id: Optional[int] = None,
    milestone_id: Optional[int] = None,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    move_overdue_open_tasks_to_backlog(project_id, session)
    q = select(Task).where(Task.project_id == project_id)
    if status:
        q = q.where(Task.status == status)
    if priority:
        q = q.where(Task.priority == priority)
    if assignee:
        q = q.where(Task.assignee == assignee)
    if sprint_id is not None:
        q = q.where(Task.sprint_id == sprint_id)
    if milestone_id is not None:
        q = q.where(Task.milestone_id == milestone_id)
    return session.exec(q).all()


@app.post("/projects/{project_id}/tasks", response_model=TaskRead)
def create_task(
    project_id: int,
    task_in: TaskCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    task = Task(**task_in.model_dump())
    task.project_id = project_id
    session.add(task)
    session.commit()
    session.refresh(task)
    return TaskRead.model_validate(task)


@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    patch: TaskUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    project = get_project_or_404(task.project_id, user_id, session)

    update_data = patch.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        record_task_history(task_id, key, getattr(task, key, None), value, user_id, session)
        setattr(task, key, value)
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    if "status" in update_data:
        session.add(ProjectEvent(
            project_id=task.project_id,
            type="task_status_changed",
            payload={"task_id": task.id, "task_title": task.title, "to": task.status},
        ))
    # Notify assignee on assignment change
    if "assignee" in update_data and update_data["assignee"]:
        push_notification(
            user_id=user_id,  # placeholder: ideally resolve assignee's user_id
            notif_type="task_assigned",
            payload={"task_id": task.id, "task_title": task.title, "assignee": update_data["assignee"]},
            session=session,
        )

    session.commit()
    return TaskRead.model_validate(task)


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, session: Session = Depends(get_session), user_id: str = Depends(get_current_user)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    get_project_or_404(task.project_id, user_id, session)
    session.delete(task)
    session.commit()


# ---------------------------------------------------------------------------
# Subtasks
# ---------------------------------------------------------------------------

@app.post("/tasks/{task_id}/subtasks", response_model=SubtaskRead)
def add_subtask(
    task_id: int,
    subtask_in: SubtaskCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    get_project_or_404(task.project_id, user_id, session)
    subtask = Subtask(task_id=task_id, **subtask_in.model_dump())
    session.add(subtask)
    session.commit()
    session.refresh(subtask)
    return subtask


@app.get("/tasks/{task_id}/subtasks", response_model=list[SubtaskRead])
def list_subtasks(
    task_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    get_project_or_404(task.project_id, user_id, session)
    return session.exec(select(Subtask).where(Subtask.task_id == task_id).order_by(Subtask.order)).all()


@app.patch("/subtasks/{subtask_id}", response_model=SubtaskRead)
def update_subtask(
    subtask_id: int,
    updates: SubtaskUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    subtask = session.get(Subtask, subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    task = session.get(Task, subtask.task_id)
    get_project_or_404(task.project_id, user_id, session)
    for key, val in updates.model_dump(exclude_unset=True).items():
        setattr(subtask, key, val)
    session.add(subtask)
    session.commit()
    session.refresh(subtask)
    return subtask


@app.delete("/subtasks/{subtask_id}", status_code=204)
def delete_subtask(subtask_id: int, session: Session = Depends(get_session), user_id: str = Depends(get_current_user)):
    subtask = session.get(Subtask, subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    task = session.get(Task, subtask.task_id)
    get_project_or_404(task.project_id, user_id, session)
    session.delete(subtask)
    session.commit()


# ---------------------------------------------------------------------------
# Comments (on tasks or ideas)
# ---------------------------------------------------------------------------

@app.post("/tasks/{task_id}/comments", response_model=CommentRead)
def add_task_comment(
    task_id: int,
    comment_in: CommentCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    get_project_or_404(task.project_id, user_id, session)
    comment = Comment(
        project_id=task.project_id,
        task_id=task_id,
        author_user_id=user_id,
        author_name=comment_in.author_name,
        text=comment_in.text,
    )
    session.add(comment)
    # Notify task assignee if different from commenter
    if task.assignee and task.assignee_slack_id:
        push_notification(
            user_id=user_id,
            notif_type="comment_posted",
            payload={"task_id": task_id, "task_title": task.title, "author": comment_in.author_name or user_id},
            session=session,
        )
    session.commit()
    session.refresh(comment)
    return CommentRead.model_validate(comment)


@app.get("/tasks/{task_id}/comments", response_model=list[CommentRead])
def list_task_comments(
    task_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    get_project_or_404(task.project_id, user_id, session)
    return session.exec(
        select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at)
    ).all()


@app.post("/ideas/{idea_id}/comments", response_model=CommentRead)
def add_idea_comment(
    idea_id: int,
    comment_in: CommentCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    idea = session.get(Idea, idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    get_project_or_404(idea.project_id, user_id, session)
    comment = Comment(
        project_id=idea.project_id,
        idea_id=idea_id,
        author_user_id=user_id,
        author_name=comment_in.author_name,
        text=comment_in.text,
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return CommentRead.model_validate(comment)


@app.get("/ideas/{idea_id}/comments", response_model=list[CommentRead])
def list_idea_comments(
    idea_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    idea = session.get(Idea, idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    get_project_or_404(idea.project_id, user_id, session)
    return session.exec(
        select(Comment).where(Comment.idea_id == idea_id).order_by(Comment.created_at)
    ).all()


@app.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, session: Session = Depends(get_session), user_id: str = Depends(get_current_user)):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    get_project_or_404(comment.project_id, user_id, session)
    session.delete(comment)
    session.commit()


# ---------------------------------------------------------------------------
# Task History (Audit Log)
# ---------------------------------------------------------------------------

@app.get("/tasks/{task_id}/history", response_model=list[TaskHistoryRead])
def get_task_history(
    task_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    get_project_or_404(task.project_id, user_id, session)
    return session.exec(
        select(TaskHistory).where(TaskHistory.task_id == task_id).order_by(TaskHistory.changed_at.desc())
    ).all()


# ---------------------------------------------------------------------------
# Attachments
# ---------------------------------------------------------------------------

@app.post("/tasks/{task_id}/attachments", response_model=TaskAttachmentRead)
async def upload_attachment(
    task_id: int,
    file: Optional[UploadFile] = File(None),
    file_url: Optional[str] = Form(None),
    file_name: Optional[str] = Form(None),
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    get_project_or_404(task.project_id, user_id, session)

    if file:
        dest = os.path.join(UPLOAD_DIR, f"{task_id}_{file.filename}")
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
        attachment = TaskAttachment(
            task_id=task_id,
            file_name=file.filename,
            file_url=f"/uploads/{task_id}_{file.filename}",
            uploaded_by=user_id,
        )
    elif file_url and file_name:
        attachment = TaskAttachment(
            task_id=task_id,
            file_name=file_name,
            file_url=file_url,
            uploaded_by=user_id,
        )
    else:
        raise HTTPException(status_code=400, detail="Provide either a file or file_url+file_name")

    session.add(attachment)
    session.commit()
    session.refresh(attachment)
    return attachment


@app.get("/tasks/{task_id}/attachments", response_model=list[TaskAttachmentRead])
def list_attachments(
    task_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    get_project_or_404(task.project_id, user_id, session)
    return session.exec(select(TaskAttachment).where(TaskAttachment.task_id == task_id)).all()


@app.delete("/attachments/{attachment_id}", status_code=204)
def delete_attachment(
    attachment_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    att = session.get(TaskAttachment, attachment_id)
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    task = session.get(Task, att.task_id)
    get_project_or_404(task.project_id, user_id, session)
    # Remove file if it's a local upload
    local_path = os.path.join(os.path.dirname(__file__), att.file_url.lstrip("/"))
    if os.path.exists(local_path):
        os.remove(local_path)
    session.delete(att)
    session.commit()


# ---------------------------------------------------------------------------
# Meeting Notes
# ---------------------------------------------------------------------------

@app.get("/projects/{project_id}/meeting-notes", response_model=list[MeetingNoteRead])
def list_meeting_notes(
    project_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    notes = session.exec(
        select(MeetingNote)
        .where(MeetingNote.project_id == project_id)
        .order_by(MeetingNote.meeting_date.desc(), MeetingNote.created_at.desc())
    ).all()
    return [MeetingNoteRead.model_validate(n) for n in notes]


@app.post("/projects/{project_id}/meeting-notes", response_model=MeetingNoteRead)
def add_meeting_note(
    project_id: int,
    note_in: MeetingNoteCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    db_note = MeetingNote(project_id=project_id, **note_in.model_dump())
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    preview = (db_note.summary or db_note.raw_text or "").strip().replace("\n", " ")
    if len(preview) > 180:
        preview = preview[:177] + "..."
    session.add(ProjectEvent(
        project_id=project_id, type="meeting_note_added",
        payload={
            "note_id": db_note.id,
            "meeting_date": str(db_note.meeting_date) if db_note.meeting_date else None,
            "preview": preview,
        },
    ))
    session.commit()
    return MeetingNoteRead.model_validate(db_note)


@app.delete("/projects/{project_id}/meeting-notes/{note_id}", status_code=204)
def delete_meeting_note(
    project_id: int,
    note_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    note = session.get(MeetingNote, note_id)
    if not note or note.project_id != project_id:
        raise HTTPException(status_code=404, detail="Meeting note not found")
    session.delete(note)
    session.commit()


# ---------------------------------------------------------------------------
# Project Events (Timeline)
# ---------------------------------------------------------------------------

@app.get("/projects/{project_id}/events", response_model=list[ProjectEventRead])
def get_project_events(
    project_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    get_project_or_404(project_id, user_id, session)
    events = session.exec(
        select(ProjectEvent)
        .where(ProjectEvent.project_id == project_id)
        .order_by(ProjectEvent.created_at)
    ).all()
    return [ProjectEventRead.model_validate(e) for e in events]


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

@app.get("/me/notifications", response_model=list[NotificationRead])
def get_notifications(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    return session.exec(
        select(InAppNotification)
        .where(InAppNotification.user_id == user_id)
        .order_by(InAppNotification.created_at.desc())
        .limit(50)
    ).all()


@app.patch("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    notif = session.get(InAppNotification, notif_id)
    if not notif or notif.user_id != user_id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    session.add(notif)
    session.commit()
    return {"ok": True}


@app.patch("/me/notifications/read-all")
def mark_all_notifications_read(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    notifs = session.exec(
        select(InAppNotification)
        .where(InAppNotification.user_id == user_id, InAppNotification.read == False)
    ).all()
    for n in notifs:
        n.read = True
        session.add(n)
    session.commit()
    return {"ok": True, "marked": len(notifs)}


# ---------------------------------------------------------------------------
# Slack + Legacy endpoints (kept for backward compatibility)
# ---------------------------------------------------------------------------

def get_project_config():
    try:
        import importlib.util
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'project_config.json')
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception:
        return {"channel_name": "all-startup-test", "project_managers": [{"slack_id": "U09SN27BXNZ"}]}


def get_channel_id():
    config = get_project_config()
    return slack_agent.find_channel_id(config.get("channel_name", "all-startup-test")) if slack_agent.client else None


@app.get("/get-online-employees")
def get_online_employees():
    try:
        employees = slack_agent.get_online_employees()
        return {"success": True, "employees": employees}
    except Exception as e:
        return {"success": False, "error": str(e), "employees": []}


@app.post("/confirm-assignments")
def confirm_assignments(data: ConfirmAssignments):
    try:
        assignments = data.assignments
        slack_count = 0
        if slack_agent.client and assignments:
            channel_id = get_channel_id()
            project_name = data.user_request[:30] + "..." if len(data.user_request) > 30 else data.user_request
            if channel_id:
                task_list = "\n".join(
                    [f"• {a['task_title']} ({a['estimated_hours']}h) - {a['assignee']}"
                     for a in assignments.get('assignments', [])]
                )
                message = f" *New Project Confirmed*\n\n*{data.user_request}*\n\n{task_list}\n\nTeam members will receive DMs with their assignments. "
                slack_agent.post_channel_message(channel_id, message)
            for assignment in assignments.get('assignments', []):
                if slack_agent.send_task_assignment(assignment, project_name, channel_id):
                    slack_count += 1
        return {"success": True, "slack_notifications": slack_count}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/assign-tasks-manually")
def assign_tasks_manually(data: ManualAssignment):
    try:
        tasks = data.decomposition.get('tasks', [])
        task_map = {str(task['id']): task for task in tasks}
        formatted_assignments = []
        for manual_assignment in data.tasks:
            task_id = str(manual_assignment.get('task_id'))
            task = task_map.get(task_id)
            if not task:
                continue
            formatted_assignments.append({
                'task_id': task_id,
                'task_title': task.get('title', ''),
                'assignee': manual_assignment.get('assignee_name'),
                'assignee_slack_id': manual_assignment.get('assignee_slack_id'),
                'reason': 'Manually assigned',
                'skills': task.get('skills_required', []),
                'estimated_hours': task.get('estimated_hours', 0)
            })
        return {
            "success": True,
            "assignments": {
                'status': 'success',
                'assignments': formatted_assignments,
                'total_tasks_assigned': len(formatted_assignments),
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# Start server
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)