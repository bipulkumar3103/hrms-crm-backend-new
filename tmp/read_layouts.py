import sys
import os
import json

# Add project root to path
sys.path.append(os.getcwd())

from app import create_app, db
from app.models.ui_metadata import UIMetadata

app = create_app()
with app.app_context():
    layout = UIMetadata.query.filter_by(page_route='/employee/dashboard', is_global=True).first()
    if layout:
        print(json.dumps(layout.ui_config, indent=2))
    else:
        print("No dashboard layout found")
