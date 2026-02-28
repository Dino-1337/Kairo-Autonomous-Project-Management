import os
import sys
from sqlmodel import Session, text

# Add current dir to path to import database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine

def check_connection():
    print(" Attempting to connect to the database...")
    try:
        with Session(engine) as session:
            # We use text() to execute a raw SQL query
            session.exec(text("SELECT 1"))
            print(" Successfully connected to the database!")
            return True
    except Exception as e:
        print(f" Failed to connect to the database. Error: {e}")
        return False

if __name__ == "__main__":
    check_connection()
