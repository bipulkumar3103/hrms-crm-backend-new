from app import create_app, db
from app.models.ui_metadata import UIMetadata
from sqlalchemy import text
import json

app = create_app()
with app.app_context():
    print("Migrating UI Metadata...")
    # Drop existing ui_metadata table if it exists
    try:
        db.session.execute(text("DROP TABLE ui_metadata;"))
        db.session.commit()
        print("Dropped old ui_metadata table.")
    except Exception as e:
        print(f"Error dropping table, might not exist: {e}")
        db.session.rollback()

    # Create it with new schema
    db.create_all()
    print("Created new ui_metadata table.")

    # Seed the global default dashboard layout
    default_dashboard_schema = {
        "components": [
            {
                "id": "header-1",
                "type": "header",
                "config": {
                    "title": "Welcome to your Employee Dashboard",
                    "subtitle": "Manage your enterprise settings and visuals below."
                }
            },
            {
                "id": "card-1",
                "type": "card",
                "config": {
                    "title": "General Information",
                    "style": {
                        "shadow": "md",
                        "border_color_variant": "primary"
                    },
                    "elements": [
                        {"label": "Company Name", "value": {"bind": "name"}},
                        {"label": "Domain", "value": {"bind": "domain"}}
                    ]
                }
            },
            {
                "id": "profile-table-1",
                "type": "table",
                "config": {
                    "title": "My User Profile",
                    "dataSource": "/api/v1/users/me",
                    "columns": [
                        {"header": "First Name", "bind": "first_name"},
                        {"header": "Last Name", "bind": "last_name"},
                        {"header": "Email", "bind": "email"},
                        {"header": "Job Title", "bind": "job_title"},
                        {"header": "Status", "bind": "status"}
                    ]
                }
            }
        ]
    }
    
    global_meta = UIMetadata(
        company_id=None,
        page_route='/employee/dashboard',
        is_global=True,
        ui_config=default_dashboard_schema
    )
    db.session.add(global_meta)
    db.session.commit()
    print("Seeded global default dashboard layout with correct field mappings.")
