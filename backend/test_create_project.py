import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Session, init_db
from project_models import Project, ProjectCreate

def test_insert():
    print("Testing DB insert...")
    try:
        project_data = ProjectCreate(name="test script", description="test script")
        db_project = Project.model_validate(project_data)
        
        with Session(engine) as session:
            session.add(db_project)
            session.commit()
            session.refresh(db_project)
            print(f"Success! Project ID: {db_project.id}")
            
    except Exception as e:
        import traceback
        with open('err.txt', 'w') as f:
            traceback.print_exc(file=f)
        print(f"Failed to create project: {e}")

if __name__ == "__main__":
    test_insert()
