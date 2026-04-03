from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

ui_blueprint = Blueprint('ui', __name__)

@ui_blueprint.route('/profile', methods=['GET'])
@jwt_required()
def get_profile_ui():
    ui_schema = {
        "components": [
            {
                "id": "header-1",
                "type": "header",
                "config": {
                    "title": "Welcome to your Dashboard",
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
                        {
                            "label": "Company Name",
                            "value": {"bind": "name"}
                        },
                        {
                            "label": "Domain",
                            "value": {"bind": "domain"}
                        },
                        {
                            "label": "Primary Color",
                            "format": "color_chip",
                            "value": {"bind": "theme_primary_color"}
                        },
                        {
                            "label": "Company Logo",
                            "format": "logo",
                            "value": {"bind": "logo_original_url"}
                        }
                    ]
                }
            }
        ]
    }
    return jsonify(ui_schema), 200
