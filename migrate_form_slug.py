import os
import sys
# Add current directory to path
sys.path.append(os.getcwd())

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE form_submissions ADD COLUMN form_slug VARCHAR(255)"))
            conn.commit()
        print("Successfully added form_slug column to form_submissions table.")
    except Exception as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'form_slug' already exists.")
        else:
            print(f"Error during migration: {str(e)}")
