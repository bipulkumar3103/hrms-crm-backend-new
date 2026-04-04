import json
from app import db, create_app
from app.models.ui_metadata import UIMetadata

def seed():
    app = create_app()
    with app.app_context():
        # --- 1. ANNOUNCEMENTS TEMPLATE ---
        announcements_layout = {
            "components": [
                {
                    "id": "ann-header",
                    "type": "header",
                    "config": {
                        "title": "Enterprise Announcements",
                        "subtitle": "Critical updates and company-wide broadcasts for the workforce.",
                        "padding": "2rem",
                        "margin": "0 0 1.5rem 0"
                    }
                },
                {
                    "id": "ann-card",
                    "type": "card",
                    "config": {
                        "title": "📌 System Broadcast",
                        "elements": [
                            {
                                "type": "text",
                                "content": "Welcome to the premium HRMS interface. All organizational updates are now synchronized in real-time."
                            }
                        ],
                        "borderWidth": "1px",
                        "borderColor": "#e2e8f0",
                        "borderRadius": "24px",
                        "shadow": "md",
                        "padding": "1.5rem"
                    }
                },
                {
                    "id": "ann-table",
                    "type": "table",
                    "config": {
                        "title": "Notice Board",
                        "dataSource": "/api/v1/announcements",
                        "columns": [
                            { "header": "Title", "bind": "title" },
                            { "header": "Description", "bind": "content" },
                            { "header": "Date", "bind": "created_at" }
                        ],
                        "borderColor": "#6366f1",
                        "borderWidth": "1px",
                        "borderRadius": "24px",
                        "shadow": "lg",
                        "padding": "2rem"
                    }
                }
            ]
        }

        # --- 2. DIRECTORY TEMPLATE ---
        directory_layout = {
            "components": [
                {
                    "id": "dir-header",
                    "type": "header",
                    "config": {
                        "title": "Elite Directory",
                        "subtitle": "Discover and connect with your global workforce.",
                        "padding": "2rem"
                    }
                },
                {
                    "id": "dir-table",
                    "type": "table",
                    "config": {
                        "title": "Workforce Registry",
                        "dataSource": "/api/v1/employees",
                        "columns": [
                            { "header": "Full Name", "bind": "name" },
                            { "header": "Department", "bind": "department" },
                            { "header": "Role", "bind": "role" },
                            { "header": "Corporate Email", "bind": "email" }
                        ],
                        "borderColor": "#4f46e5",
                        "borderWidth": "1px",
                        "borderRadius": "32px",
                        "shadow": "sm",
                        "padding": "1.5rem"
                    }
                }
            ]
        }

        templates = [
            ("/employee/announcements", announcements_layout),
            ("/employee/directory", directory_layout)
        ]

        for route, schema in templates:
            # Check if global already exists
            existing = UIMetadata.query.filter_by(page_route=route, is_global=True).first()
            if existing:
                existing.ui_config = schema
                print(f"Updated global template for {route}")
            else:
                new_layout = UIMetadata(
                    page_route=route,
                    ui_config=schema,
                    is_global=True,
                    company_id=None
                )
                db.session.add(new_layout)
                print(f"Seeded global template for {route}")

        db.session.commit()
        print("Enterprise Seeding Complete.")

if __name__ == "__main__":
    seed()
