from app import create_app, db
from app.models.user import User
from app.models.company import Company
from app.models.role import Role

app = create_app()
with app.app_context():
    users = User.query.all()
    print("--- USER DIAGNOSTIC ---")
    for u in users:
        roles = [r.name for r in u.roles]
        comp_name = u.company.name if u.company else "NONE"
        print(f"User: {u.email} | ID: {u.id} | Status: {u.status} | Role: {roles} | Company: {comp_name}")
        if u.company:
            print(f"  -> Theme Primary: {u.company.theme_primary_color}")
            print(f"  -> SMTP Host: {u.company.smtp_host}")
    
    companies = Company.query.all()
    print("\n--- COMPANY DIAGNOSTIC ---")
    for c in companies:
        print(f"Company: {c.name} | ID: {c.id} | Theme Primary: {c.theme_primary_color}")
