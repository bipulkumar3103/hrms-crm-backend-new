import sqlite3
import os

db_path = os.path.join('instance', 'app.db')

def check_table(cursor, table_name):
    print(f"\n--- Checking Table: {table_name} ---")
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = {info[1]: info[2] for info in cursor.fetchall()}
    if not columns:
        print(f"  [!] Table {table_name} DOES NOT EXIST.")
    else:
        for col, col_type in columns.items():
            print(f"  [ ] Column: {col} ({col_type})")
    return columns

if not os.path.exists(db_path):
    print("DB_NOT_FOUND")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    check_table(cursor, 'projects')
    check_table(cursor, 'project_assignments')
    check_table(cursor, 'timesheets')
    check_table(cursor, 'timesheet_days')
    check_table(cursor, 'time_punches')
    check_table(cursor, 'approval_logs')
    
    conn.close()
