from flask import Blueprint, request, jsonify
from app import db
from app.models.metadata_engine import UIPage
from app.utils.decorators import require_role

ui_metadata_blueprint = Blueprint('ui_metadata', __name__)

@ui_metadata_blueprint.route('/pages', methods=['POST'])
def create_page():
    data = request.get_json()
    new_page = UIPage(
        company_id=1,  # Assuming a company_id for now
        name=data['title'],
        slug=data['slug'],
        route=data['slug'],
        title=data['title'],
        is_active=True
    )
    db.session.add(new_page)
    db.session.commit()
    return jsonify({'message': 'Page created successfully'}), 201

@ui_metadata_blueprint.route('/', methods=['POST'])
@require_role('admin')
def update_ui_metadata():
    return jsonify({'message': 'UI metadata updated successfully'}), 200
