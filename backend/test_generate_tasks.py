import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import traceback
from database import engine, init_db
from sqlmodel import Session
from project_models import Project, Idea
from graph.workflow import workflow_app

PROJECT_ID = 1   # already exists from previous test
IDEA_TEXT  = "a landing page needs to be built in react"

def test_ideas():
    print("Testing idea -> tasks generation...")
    try:
        context = {
            "urgency": False,
            "deadline": "None",
            "require_approval": False,
            "assignment_mode": "auto",
        }
        initial_state = {"user_request": IDEA_TEXT, "context": context}

        print("  Invoking LangGraph workflow...")
        final_state = workflow_app.invoke(initial_state)

        decomposition = final_state.get("decomposition", {}) or {}
        assignments   = final_state.get("assignments")  or {}
        tasks_data    = decomposition.get("tasks", []) if isinstance(decomposition, dict) else []

        print(f"  decomposition status : {decomposition.get('status')}")
        print(f"  tasks returned       : {len(tasks_data)}")

        with Session(engine) as session:
            db_idea = Idea(project_id=PROJECT_ID, text=IDEA_TEXT)
            session.add(db_idea)
            session.commit()
            session.refresh(db_idea)
            print(f"  Idea saved, id={db_idea.id}")

        print("Done!")

    except Exception:
        msg = traceback.format_exc()
        with open("gen_error.txt", "w", encoding="utf-8") as f:
            f.write(msg)
        print(msg)

if __name__ == "__main__":
    init_db()
    test_ideas()
