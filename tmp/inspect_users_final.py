import os
import sys

# Add the current directory to sys.path to find 'app'
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.user import User

app = create_app()
with app.app_context():
    users = User.query.all()
    print("--- FULL USER LIST ---")
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Name: {u.first_name} {u.last_name}, ManagerID: {u.manager_id}, CompanyID: {u.company_id}, Active: {u.is_active}, Status: {u.status}")
    print("----------------------")
