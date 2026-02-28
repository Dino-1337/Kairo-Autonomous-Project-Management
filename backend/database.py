import os
from typing import Generator

from sqlmodel import SQLModel, Session, create_engine


def get_database_url() -> str:
    """
    Resolve database URL.

    Prefer DATABASE_URL env (e.g. mysql+pymysql://user:pwd@host/db),
    otherwise fall back to a local SQLite file for easy dev.
    """
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url

    # Default: SQLite file next to backend code
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.join(base_dir, "project_manager.db")
    return f"sqlite:///{sqlite_path}"


DATABASE_URL = get_database_url()
engine = create_engine(DATABASE_URL, echo=False)


def init_db() -> None:
    """Create database tables if they don't exist."""
    import project_models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    with Session(engine) as session:
        yield session

