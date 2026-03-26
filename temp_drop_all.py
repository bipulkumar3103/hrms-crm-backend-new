
from app import create_app, db

# Create an application instance to establish the context
app = create_app()

# Push the application context
with app.app_context():
    # The drop_all() function drops all tables defined in the models
    db.drop_all()
    print("All tables dropped successfully.")
