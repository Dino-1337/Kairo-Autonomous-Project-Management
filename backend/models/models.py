from __future__ import annotations

from datetime import datetime, date
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON
from sqlmodel import Column, Field, Relationship, SQLModel


class ProjectBase(SQLModel):
    name: str
    description: Optional[str] = None
    status: str = "active"


class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    ideas: List["Idea"] = Relationship(back_populates="project")
    tasks: List["Task"] = Relationship(back_populates="project")
    meeting_notes: List["MeetingNote"] = Relationship(back_populates="project")
    events: List["ProjectEvent"] = Relationship(back_populates="project")


class ProjectCreate(ProjectBase):
    pass


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

    project: Optional[Project] = Relationship(back_populates="ideas")
    tasks: List["Task"] = Relationship(back_populates="idea")


class IdeaCreate(IdeaBase):
    pass


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

    project: Optional[Project] = Relationship(back_populates="tasks")
    idea: Optional[Idea] = Relationship(back_populates="tasks")


class TaskCreate(TaskBase):
    project_id: int
    idea_id: Optional[int] = None


class TaskRead(TaskBase):
    id: int
    project_id: int
    idea_id: Optional[int]
    created_at: datetime
    updated_at: datetime


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

    project: Optional[Project] = Relationship(back_populates="meeting_notes")


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

    project: Optional[Project] = Relationship(back_populates="events")


class ProjectEventRead(ProjectEventBase):
    id: int
    project_id: int
    created_at: datetime

