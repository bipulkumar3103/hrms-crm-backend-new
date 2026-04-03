import sqlite3
import os

db_path = os.path.join('instance', 'app.db')

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE form_submissions ADD COLUMN form_slug VARCHAR(255)")
        conn.commit()
        conn.close()
        print("Successfully added form_slug column to form_submissions table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'form_slug' already exists.")
        else:
            print(f"SQLite Error: {e}")
    except Exception as e:
        print(f"Error: {e}")
