import os
from app import create_app, db
from app.models.role import Role

print("--- Database Reset Script ---")
app = create_app()
with app.app_context():
    print("Dropping all database tables...")
    db.drop_all()
    
    # Try to forcibly delete the SQLite db file to prevent constraints issues
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if db_uri.startswith('sqlite:///'):
        db_path = os.path.abspath(db_uri.replace('sqlite:///', ''))
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
                print(f"Force-deleted existing database file: {db_path}")
            except Exception as e:
                print(f"Note: Could not physically delete db file (may be locked): {e}")

    print("Tables dropped.")
    
    print("Creating all database tables...")
    db.create_all()
    print("Tables created.")
    
    print("Seeding initial roles (superadmin, admin, employee)...")
    try:
        db.session.add(Role(name='superadmin'))
        db.session.add(Role(name='admin'))
        db.session.add(Role(name='employee'))
        db.session.commit()
        print("Roles seeded successfully.")
    except Exception as e:
        print(f"Error seeding roles: {e}")
        db.session.rollback()

print("--- Database Reset Complete ---")
