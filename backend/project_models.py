
from datetime import datetime, date
from typing import Any, Dict, List, Optional

from pydantic import model_validator
from sqlalchemy import JSON
from sqlmodel import Column, Field, Relationship, SQLModel


class ProjectBase(SQLModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    user_id: str = "global"  # Defaults to global for backward compatibility


class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    ideas: List["Idea"] = Relationship(back_populates="project")
    tasks: List["Task"] = Relationship(back_populates="project")
    meeting_notes: List["MeetingNote"] = Relationship(back_populates="project")
    events: List["ProjectEvent"] = Relationship(back_populates="project")


class ProjectCreate(SQLModel):
    name: str
    description: Optional[str] = None

class ProjectRead(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime


class IdeaBase(SQLModel):
    text: str
    source: str = "manual"  # manual | meeting


class Idea(IdeaBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional["Project"] = Relationship(back_populates="ideas")
    tasks: List["Task"] = Relationship(back_populates="idea")


class IdeaCreate(IdeaBase):
    urgency: bool = False
    deadline: str = "None"
    require_approval: bool = False
    assignment_mode: str = "auto"  # auto | manual


class IdeaRead(IdeaBase):
    id: int
    project_id: int
    created_at: datetime


class TaskBase(SQLModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"  # todo | in_progress | done | blocked
    assignee: Optional[str] = None
    assignee_slack_id: Optional[str] = None
    estimated_hours: Optional[float] = None
    due_date: Optional[date] = None
    skills_required: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    depends_on_ids: List[int] = Field(default_factory=list, sa_column=Column(JSON))


class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    idea_id: Optional[int] = Field(default=None, foreign_key="idea.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional["Project"] = Relationship(back_populates="tasks")
    idea: Optional["Idea"] = Relationship(back_populates="tasks")


class TaskCreate(TaskBase):
    project_id: int
    idea_id: Optional[int] = None


class TaskRead(TaskBase):
    id: int
    project_id: int
    idea_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def coerce_list_fields(cls, values: Any) -> Any:
        """Normalise list fields that may be None or a bare int in old DB rows."""
        if hasattr(values, "__dict__"):
            # ORM object — patch attributes directly
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
    status: Optional[str] = None
    assignee: Optional[str] = None
    assignee_slack_id: Optional[str] = None
    estimated_hours: Optional[float] = None
    due_date: Optional[date] = None


class MeetingNoteBase(SQLModel):
    raw_text: str
    summary: Optional[str] = None
    meeting_date: Optional[date] = None


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

