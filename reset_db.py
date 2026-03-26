
from app import create_app, db
from app.models.role import Role

print("--- Database Reset Script ---")
app = create_app()
with app.app_context():
    print("Dropping all database tables...")
    db.drop_all()
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
