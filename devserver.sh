#!/bin/sh
# Activate the virtual environment
source .venv/bin/activate

# Run the Flask application using Gunicorn for better performance
# The app is now created in run.py, so we point to the 'app' variable in the 'run' module
gunicorn --bind 0.0.0.0:5000 --workers 1 --threads 8 --timeout 0 run:app --reload
