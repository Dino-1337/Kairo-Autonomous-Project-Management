"""
migrate_mysql.py — Safe, database-agnostic schema migration.

Uses the same engine as app.py (reads DATABASE_URL env var automatically).
Safe to run multiple times — skips columns/tables that already exist.

Run from the backend directory with venv activated:
    python migrate_mysql.py
"""

import sys
import os

# Add backend dir to path so we can import database.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, DATABASE_URL
from sqlalchemy import text, inspect


print(f"Using database: {DATABASE_URL.split('?')[0]}")

is_mysql = "mysql" in DATABASE_URL.lower()
is_sqlite = "sqlite" in DATABASE_URL.lower()

inspector = inspect(engine)


def column_exists(table: str, column: str) -> bool:
    try:
        cols = [c["name"] for c in inspector.get_columns(table)]
        return column in cols
    except Exception:
        return False


def table_exists(table: str) -> bool:
    return table in inspector.get_table_names()


# ── 1. Alter task table ───────────────────────────────────────────────────────

task_new_cols = [
    ("priority",        "VARCHAR(20) DEFAULT 'medium'" if is_mysql else "TEXT DEFAULT 'medium'"),
    ("task_type",       "VARCHAR(20) DEFAULT 'task'" if is_mysql else "TEXT DEFAULT 'task'"),
    ("start_date",      "DATE"),
    ("sprint_id",       "INT"),
    ("milestone_id",    "INT"),
    ("parent_task_id",  "INT"),
    ("recurrence",      "VARCHAR(50)" if is_mysql else "TEXT"),
]

print("\n── task table ──")
with engine.connect() as conn:
    for col, col_def in task_new_cols:
        if not column_exists("task", col):
            conn.execute(text(f"ALTER TABLE task ADD COLUMN {col} {col_def}"))
            conn.commit()
            print(f"  + task.{col} added")
        else:
            print(f"  · task.{col} already exists — skipped")


# ── 2. Create new tables ──────────────────────────────────────────────────────

print("\n── new tables ──")
import project_models  # registers all models with SQLModel.metadata
from sqlmodel import SQLModel

NEW_TABLE_NAMES = [
    "sprint", "milestone", "subtask", "comment",
    "taskhistory", "taskattachment", "inappnotification",
]

# Re-inspect after potential column additions
inspector2 = inspect(engine)
existing_tables = set(inspector2.get_table_names())

# Create only the tables that don't exist yet
tables_to_create = {
    name: SQLModel.metadata.tables[name]
    for name in NEW_TABLE_NAMES
    if name not in existing_tables and name in SQLModel.metadata.tables
}

if tables_to_create:
    SQLModel.metadata.create_all(engine, tables=list(tables_to_create.values()))
    for name in tables_to_create:
        print(f"  + {name} created")
else:
    print("  · all new tables already exist — skipped")

print("\n✅  Migration complete!\n")
