import sqlite3
import os

db_path = os.path.join('instance', 'app.db')

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    columns_to_add = [
        "avatar_original_url VARCHAR(255)",
        "avatar_medium_url VARCHAR(255)",
        "avatar_small_url VARCHAR(255)",
        "dob VARCHAR(20)",
        "address_temporary TEXT",
        "address_permanent TEXT",
        "pan_number VARCHAR(15)",
        "aadhar_number VARCHAR(20)",
        "uan VARCHAR(20)"
    ]

    for column in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {column}")
        except Exception as e:
            print(f"Column {column} likely already exists or error: {e}")

    try:
        cursor.execute("ALTER TABLE company ADD COLUMN employee_dashboard_schema TEXT")
        print("Added employee_dashboard_schema to company.")
    except Exception as e:
        print(f"Column employee_dashboard_schema likely already exists or error: {e}")

    conn.commit()
    conn.close()
    print("Database columns added successfully.")
else:
    print("Database not found at instance/app.db")
