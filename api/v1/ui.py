
from flask import Blueprint, jsonify

ui_blueprint = Blueprint('ui', __name__)

@ui_blueprint.route('/profile', methods=['GET'])
def get_profile_ui():
    """
    Defines the dynamic UI structure for the company profile page.
    """
    ui_structure = {
        "page_title": "Company Dashboard",
        "components": [
            {
                "id": "comp-1",
                "type": "header",
                "config": {
                    "title": {"bind": "name"},
                    "subtitle": {"bind": "domain"}
                }
            },
            {
                "id": "comp-2",
                "type": "card",
                "config": {
                    "title": "Company Details",
                    "style": {
                        "shadow": "md",
                        "border_color_variant": "primary"
                    },
                    "elements": [
                        {"label": "Website", "value": {"bind": "website"}, "format": "link"},
                        {"label": "Phone", "value": {"bind": "phone"}, "format": "text"},
                        {"label": "Address", "value": {"bind": "address"}, "format": "text"}
                    ]
                }
            },
            {
                "id": "comp-3",
                "type": "card",
                "config": {
                    "title": "Theme Preview",
                    "style": {
                        "shadow": "md"
                    },
                    "elements": [
                        {"label": "Primary", "value": {"bind": "theme_primary_color"}, "format": "color_chip"},
                        {"label": "Secondary", "value": {"bind": "theme_secondary_color"}, "format": "color_chip"},
                        {"label": "Accent", "value": {"bind": "theme_accent_color"}, "format": "color_chip"},
                        {"label": "Background", "value": {"bind": "theme_bg_color"}, "format": "color_chip"},
                        {"label": "Text", "value": {"bind": "theme_text_color"}, "format": "color_chip"}
                    ]
                }
            }
        ]
    }
    return jsonify(ui_structure)
