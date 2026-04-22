
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_current_user
from app.models.user import User
from app import db

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

    if current_user.has_role('superadmin') or current_user.has_role('admin'):
        company_data.update({
            "smtp_host": company.smtp_host,
            "smtp_port": company.smtp_port,
            "smtp_username": company.smtp_username,
            "smtp_from_email": company.smtp_from_email
        })
    
    return jsonify(company_data), 200

@company_blueprint.route('/me', methods=['PUT'])
@jwt_required()
def update_my_company():
    """Updates the company details associated with the current logged-in user."""
    current_user = get_current_user()
    company = current_user.company

    if not company:
        return jsonify({"message": "User is not associated with any company."}), 404

    # Ensure only superadmin can update details
    if not current_user.has_role('superadmin'):
        return jsonify({"message": "Unauthorized."}), 403

    data = request.get_json()
    
    expected_fields = ['name', 'domain', 'address', 'phone', 'website']
    for field in expected_fields:
        if field in data:
            setattr(company, field, data[field])
            
    db.session.commit()
    
    return jsonify({"message": "Company details updated successfully."}), 200
@company_blueprint.route('/theme', methods=['POST'])
@jwt_required()
def update_theme():
    """Updates the theme colors for the company."""
    current_user = get_current_user()
    company = current_user.company

    if not company:
        return jsonify({"message": "User is not associated with any company."}), 404

    # Ensure only superadmin can update theme
    if not current_user.has_role('superadmin'):
        return jsonify({"message": "Unauthorized."}), 403

    data = request.get_json()
    
    if 'theme_primary_color' in data:
        company.theme_primary_color = data['theme_primary_color']
    if 'theme_secondary_color' in data:
        company.theme_secondary_color = data['theme_secondary_color']
    if 'theme_accent_color' in data:
        company.theme_accent_color = data['theme_accent_color']
    if 'theme_bg_color' in data:
        company.theme_bg_color = data['theme_bg_color']
    if 'theme_text_color' in data:
        company.theme_text_color = data['theme_text_color']
        
    db.session.commit()
    
    return jsonify({"message": "Theme configuration saved successfully."}), 200

@company_blueprint.route('/mail-config', methods=['POST'])
@jwt_required()
def configure_mail():
    """Configures the SMTP parameters for the company."""
    current_user = get_current_user()
    company = current_user.company

    if not company:
        return jsonify({"message": "User is not associated with any company."}), 404

    data = request.get_json()
    
    # Store settings
    company.smtp_host = data.get('smtp_host', company.smtp_host)
    company.smtp_port = data.get('smtp_port', company.smtp_port)
    company.smtp_username = data.get('smtp_username', company.smtp_username)
    company.smtp_password = data.get('smtp_password', company.smtp_password)
    company.smtp_from_email = data.get('smtp_from_email', company.smtp_from_email)

    db.session.commit()
    
    return jsonify({"message": "Mail configuration saved successfully.", "smtp_host": company.smtp_host}), 200

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
