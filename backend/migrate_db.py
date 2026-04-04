"""
migrate_db.py — One-time migration to add new columns and tables.

Run from the backend directory:
    python migrate_db.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "project_manager.db")


def column_exists(cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def table_exists(cursor, table: str) -> bool:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cursor.fetchone() is not None


def main():
    print(f"Migrating: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ── Task table: add new columns ─────────────────────────────────────────
    task_new_cols = [
        ("priority",        "TEXT DEFAULT 'medium'"),
        ("task_type",       "TEXT DEFAULT 'task'"),
        ("start_date",      "DATE"),
        ("sprint_id",       "INTEGER REFERENCES sprint(id)"),
        ("milestone_id",    "INTEGER REFERENCES milestone(id)"),
        ("parent_task_id",  "INTEGER REFERENCES task(id)"),
        ("recurrence",      "TEXT"),
    ]
    for col, col_def in task_new_cols:
        if not column_exists(cur, "task", col):
            cur.execute(f"ALTER TABLE task ADD COLUMN {col} {col_def}")
            print(f"  task.{col} added")
        else:
            print(f"  task.{col} already exists — skipped")

    # ── Sprint table ────────────────────────────────────────────────────────
    if not table_exists(cur, "sprint"):
        cur.execute("""
            CREATE TABLE sprint (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id  INTEGER NOT NULL REFERENCES project(id),
                name        TEXT NOT NULL,
                goal        TEXT,
                start_date  DATE,
                end_date    DATE,
                status      TEXT DEFAULT 'planning',
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  sprint table created")

    # ── Milestone table ─────────────────────────────────────────────────────
    if not table_exists(cur, "milestone"):
        cur.execute("""
            CREATE TABLE milestone (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id  INTEGER NOT NULL REFERENCES project(id),
                name        TEXT NOT NULL,
                description TEXT,
                due_date    DATE,
                status      TEXT DEFAULT 'pending',
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  milestone table created")

    # ── Subtask table ───────────────────────────────────────────────────────
    if not table_exists(cur, "subtask"):
        cur.execute("""
            CREATE TABLE subtask (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id     INTEGER NOT NULL REFERENCES task(id),
                title       TEXT NOT NULL,
                done        INTEGER DEFAULT 0,
                "order"     INTEGER DEFAULT 0,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  subtask table created")

    # ── Comment table ───────────────────────────────────────────────────────
    if not table_exists(cur, "comment"):
        cur.execute("""
            CREATE TABLE comment (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id      INTEGER NOT NULL REFERENCES project(id),
                task_id         INTEGER REFERENCES task(id),
                idea_id         INTEGER REFERENCES idea(id),
                author_user_id  TEXT NOT NULL,
                author_name     TEXT,
                text            TEXT NOT NULL,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  comment table created")

    # ── TaskHistory table ─────────────────────────────────────────────────
    if not table_exists(cur, "taskhistory"):
        cur.execute("""
            CREATE TABLE taskhistory (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id     INTEGER NOT NULL REFERENCES task(id),
                field       TEXT NOT NULL,
                old_value   TEXT,
                new_value   TEXT,
                changed_by  TEXT NOT NULL,
                changed_at  DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  taskhistory table created")

    # ── TaskAttachment table ───────────────────────────────────────────────
    if not table_exists(cur, "taskattachment"):
        cur.execute("""
            CREATE TABLE taskattachment (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id     INTEGER NOT NULL REFERENCES task(id),
                file_name   TEXT NOT NULL,
                file_url    TEXT NOT NULL,
                uploaded_by TEXT NOT NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  taskattachment table created")

    # ── InAppNotification table ────────────────────────────────────────────
    if not table_exists(cur, "inappnotification"):
        cur.execute("""
            CREATE TABLE inappnotification (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     TEXT NOT NULL,
                type        TEXT NOT NULL,
                payload     TEXT DEFAULT '{}',
                read        INTEGER DEFAULT 0,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  inappnotification table created")

    conn.commit()
    conn.close()
    print("\nMigration complete!")


if __name__ == "__main__":
    main()
