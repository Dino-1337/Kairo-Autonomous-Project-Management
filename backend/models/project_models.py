from datetime import datetime, date
from typing import Any, Dict, List, Optional

from pydantic import model_validator
from sqlalchemy import JSON, Text
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlmodel import Column, Field, Relationship, SQLModel


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------

class ProjectBase(SQLModel):
    name: str
    description: Optional[str] = None
    status: str = "active"  # active | paused | completed | archived
    user_id: str = "global"


class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    ideas: List["Idea"] = Relationship(back_populates="project", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    tasks: List["Task"] = Relationship(back_populates="project", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    meeting_notes: List["MeetingNote"] = Relationship(back_populates="project", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    events: List["ProjectEvent"] = Relationship(back_populates="project", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    sprints: List["Sprint"] = Relationship(back_populates="project", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    milestones: List["Milestone"] = Relationship(back_populates="project", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    comments: List["Comment"] = Relationship(back_populates="project", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class ProjectCreate(SQLModel):
    name: str
    description: Optional[str] = None


class ProjectRead(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Sprint  (must be defined before Task so FK resolves cleanly)
# ---------------------------------------------------------------------------

class SprintBase(SQLModel):
    name: str
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "planning"  # planning | active | completed


class Sprint(SprintBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional["Project"] = Relationship(back_populates="sprints")
    tasks: List["Task"] = Relationship(back_populates="sprint")


class SprintCreate(SprintBase):
    pass


class SprintRead(SprintBase):
    id: int
    project_id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Milestone  (must be defined before Task so FK resolves cleanly)
# ---------------------------------------------------------------------------

class MilestoneBase(SQLModel):
    name: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "pending"  # pending | reached | missed


class Milestone(MilestoneBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional["Project"] = Relationship(back_populates="milestones")
    tasks: List["Task"] = Relationship(back_populates="milestone")


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneRead(MilestoneBase):
    id: int
    project_id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Idea
# ---------------------------------------------------------------------------

class IdeaBase(SQLModel):
    text: str = Field(sa_column=Column(Text().with_variant(LONGTEXT, "mysql")))
    source: str = "manual"  # manual | meeting


class Idea(IdeaBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional["Project"] = Relationship(back_populates="ideas")
    tasks: List["Task"] = Relationship(back_populates="idea", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    comments: List["Comment"] = Relationship(back_populates="idea", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class IdeaCreate(IdeaBase):
    urgency: bool = False
    deadline: str = "None"
    require_approval: bool = False
    assignment_mode: str = "auto"  # auto | manual


class IdeaRead(IdeaBase):
    id: int
    project_id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------

class TaskBase(SQLModel):
    title: str
    description: Optional[str] = None
    # Workflow
    status: str = "todo"  # backlog | todo | in_progress | in_review | done | blocked
    priority: str = "medium"  # low | medium | high | critical
    task_type: str = "task"  # task | bug | feature | chore
    # Scheduling
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimated_hours: Optional[float] = None
    # Assignment
    assignee: Optional[str] = None
    assignee_slack_id: Optional[str] = None
    # Stored as JSON columns
    skills_required: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    depends_on_ids: List[int] = Field(default_factory=list, sa_column=Column(JSON))
    # Recurrence
    recurrence: Optional[str] = None  # daily | weekly | biweekly | monthly


class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    idea_id: Optional[int] = Field(default=None, foreign_key="idea.id")
    sprint_id: Optional[int] = Field(default=None, foreign_key="sprint.id")
    milestone_id: Optional[int] = Field(default=None, foreign_key="milestone.id")
    parent_task_id: Optional[int] = Field(default=None, foreign_key="task.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional["Project"] = Relationship(back_populates="tasks")
    idea: Optional["Idea"] = Relationship(back_populates="tasks")
    sprint: Optional["Sprint"] = Relationship(back_populates="tasks")
    milestone: Optional["Milestone"] = Relationship(back_populates="tasks")
    subtasks: List["Subtask"] = Relationship(back_populates="task", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    attachments: List["TaskAttachment"] = Relationship(back_populates="task", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    history: List["TaskHistory"] = Relationship(back_populates="task", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    comments: List["Comment"] = Relationship(back_populates="task", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class TaskCreate(TaskBase):
    project_id: int
    idea_id: Optional[int] = None
    sprint_id: Optional[int] = None
    milestone_id: Optional[int] = None
    parent_task_id: Optional[int] = None


class TaskRead(TaskBase):
    id: int
    project_id: int
    idea_id: Optional[int] = None
    sprint_id: Optional[int] = None
    milestone_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def coerce_list_fields(cls, values: Any) -> Any:
        """Normalise list fields that may be None or a bare int in old DB rows."""
        if hasattr(values, "__dict__"):
            for field in ("depends_on_ids", "skills_required"):
                val = getattr(values, field, None)
                if val is None:
                    setattr(values, field, [])
                elif not isinstance(val, list):
                    setattr(values, field, [val])
        elif isinstance(values, dict):
            for field in ("depends_on_ids", "skills_required"):
                val = values.get(field)
                if val is None:
                    values[field] = []
                elif not isinstance(val, list):
                    values[field] = [val]
        return values


class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    task_type: Optional[str] = None
    assignee: Optional[str] = None
    assignee_slack_id: Optional[str] = None
    estimated_hours: Optional[float] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    sprint_id: Optional[int] = None
    milestone_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    recurrence: Optional[str] = None
    skills_required: Optional[List[str]] = None
    depends_on_ids: Optional[List[int]] = None


# ---------------------------------------------------------------------------
# Subtask
# ---------------------------------------------------------------------------

class SubtaskBase(SQLModel):
    title: str
    done: bool = False
    order: int = 0


class Subtask(SubtaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    task: Optional["Task"] = Relationship(back_populates="subtasks")


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskRead(SubtaskBase):
    id: int
    task_id: int
    created_at: datetime


class SubtaskUpdate(SQLModel):
    title: Optional[str] = None
    done: Optional[bool] = None
    order: Optional[int] = None


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------

class CommentBase(SQLModel):
    text: str = Field(sa_column=Column(Text))
    author_user_id: str
    author_name: Optional[str] = None


class Comment(CommentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    task_id: Optional[int] = Field(default=None, foreign_key="task.id")
    idea_id: Optional[int] = Field(default=None, foreign_key="idea.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional["Project"] = Relationship(back_populates="comments")
    task: Optional["Task"] = Relationship(back_populates="comments")
    idea: Optional["Idea"] = Relationship(back_populates="comments")


class CommentCreate(SQLModel):
    text: str
    author_name: Optional[str] = None


class CommentRead(CommentBase):
    id: int
    project_id: int
    task_id: Optional[int] = None
    idea_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# TaskHistory (Audit Log)
# ---------------------------------------------------------------------------

class TaskHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    field: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: str  # user_id
    changed_at: datetime = Field(default_factory=datetime.utcnow)

    task: Optional["Task"] = Relationship(back_populates="history")


class TaskHistoryRead(SQLModel):
    id: int
    task_id: int
    field: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: str
    changed_at: datetime


# ---------------------------------------------------------------------------
# TaskAttachment
# ---------------------------------------------------------------------------

class TaskAttachmentBase(SQLModel):
    file_name: str
    file_url: str
    uploaded_by: str


class TaskAttachment(TaskAttachmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    task: Optional["Task"] = Relationship(back_populates="attachments")


class TaskAttachmentCreate(SQLModel):
    file_name: str
    file_url: str


class TaskAttachmentRead(TaskAttachmentBase):
    id: int
    task_id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# InAppNotification
# ---------------------------------------------------------------------------

class InAppNotification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    type: str  # task_assigned | comment_mention | status_changed | task_due_soon
    payload: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class NotificationRead(SQLModel):
    id: int
    user_id: str
    type: str
    payload: Dict[str, Any]
    read: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# MeetingNote
# ---------------------------------------------------------------------------

class MeetingNoteBase(SQLModel):
    raw_text: str = Field(sa_column=Column(Text().with_variant(LONGTEXT, "mysql")))
    summary: Optional[str] = None
    meeting_date: Optional[date] = None
    insights: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))


class MeetingNote(MeetingNoteBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional["Project"] = Relationship(back_populates="meeting_notes")


class MeetingNoteCreate(MeetingNoteBase):
    pass


class MeetingNoteRead(MeetingNoteBase):
    id: int
    project_id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# ProjectEvent
# ---------------------------------------------------------------------------

class ProjectEventBase(SQLModel):
    type: str
    payload: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))


class ProjectEvent(ProjectEventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional["Project"] = Relationship(back_populates="events")


class ProjectEventRead(ProjectEventBase):
    id: int
    project_id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Stats (response schema only, no table)
# ---------------------------------------------------------------------------

class ProjectStats(SQLModel):
    total_tasks: int
    by_status: Dict[str, int]
    by_priority: Dict[str, int]
    by_assignee: Dict[str, int]
    completed_last_7_days: int
    overdue_count: int
    completion_percent: float
