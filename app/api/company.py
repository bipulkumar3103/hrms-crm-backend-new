
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_current_user
from app.models.user import User

company_blueprint = Blueprint('company', __name__, url_prefix='/company')

@company_blueprint.route('/me', methods=['GET'])
@jwt_required()
def get_my_company():
    """Fetches the company associated with the current logged-in user."""
    current_user = get_current_user()
    company = current_user.company

    if not company:
        return jsonify({"message": "User is not associated with any company."}), 404

    # Manually create the dictionary to bypass the schema for debugging.
    company_data = {
        "id": company.id,
        "name": company.name,
        "domain": company.domain,
        "address": company.address,
        "logo_original_url": company.logo_original_url,
        "logo_medium_url": company.logo_medium_url,
        "logo_small_url": company.logo_small_url,
        "phone": company.phone,
        "website": company.website,
        "profile_complete": company.profile_complete,
        "theme_primary_color": company.theme_primary_color,
        "theme_secondary_color": company.theme_secondary_color,
        "theme_accent_color": company.theme_accent_color,
        "theme_bg_color": company.theme_bg_color,
        "theme_text_color": company.theme_text_color
    }
    
    return jsonify(company_data), 200

@company_blueprint.route('/branding/<invitation_token>', methods=['GET'])
def get_company_branding(invitation_token):
    """
    Provides company branding details based on a user's invitation token.
    This is a public endpoint and does not require authentication.
    """
    user = User.query.filter_by(invitation_token=invitation_token).first()

    if not user or not user.company:
        return jsonify({"message": "Invalid or expired invitation token."}), 404

    company = user.company
    
    branding_data = {
        "name": company.name,
        "logo_medium_url": company.logo_medium_url,
        "theme_primary_color": company.theme_primary_color,
        "theme_secondary_color": company.theme_secondary_color,
        "theme_accent_color": company.theme_accent_color,
        "theme_bg_color": company.theme_bg_color,
        "theme_text_color": company.theme_text_color
    }

    return jsonify(branding_data), 200
