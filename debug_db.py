import sqlite3
import os

db_path = os.path.join('instance', 'app.db')
if not os.path.exists(db_path):
    print("DB_NOT_FOUND")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Projects Table ---")
    cursor.execute("SELECT * FROM projects")
    rows = cursor.fetchall()
    for row in rows:
        print(row)
        
    print("\n--- Project Assignments Table ---")
    try:
        cursor.execute("SELECT * FROM project_assignments")
        rows = cursor.fetchall()
        for row in rows:
            print(row)
    except Exception as e:
        print(f"Error reading assignments: {e}")
        
    conn.close()
