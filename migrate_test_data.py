import sqlite3
import os

db_path = os.path.join('instance', 'app.db')

if not os.path.exists(db_path):
    print("DB_NOT_FOUND")
else:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # 1. Fetch old project
    c.execute("SELECT name, code, company_id, description FROM projects LIMIT 1")
    p = c.fetchone()
    
    if p:
        # 2. Insert into nx_projects
        print(f"Migrating Project: {p[0]} ({p[1]})")
        c.execute("INSERT INTO nx_projects (name, code, company_id, description, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)", 
                  (p[0], p[1], p[2], p[3], 1, '2026-04-07 12:00:00'))
        new_project_id = c.lastrowid
        
        # 3. Fetch old assignment
        c.execute("SELECT user_id FROM project_assignments WHERE project_id=1")
        u = c.fetchone()
        
        if u:
            # 4. Insert into nx_project_assignments
            print(f"Migrating Assignment for User ID: {u[0]}")
            c.execute("INSERT INTO nx_project_assignments (user_id, project_id, assigned_at) VALUES (?, ?, ?)", 
                      (u[0], new_project_id, '2026-04-07 12:00:00'))
    
    conn.commit()
    conn.close()
    print("Migration successful.")
