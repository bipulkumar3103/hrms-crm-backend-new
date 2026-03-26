import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_current_user, create_access_token
from app.models.company import Company
from app.models.role import Role
from app.services.s3_service import S3Service
from app import db

onboarding_blueprint = Blueprint('onboarding', __name__)
logger = logging.getLogger(__name__)

@onboarding_blueprint.route('/complete-profile/details', methods=['POST'])
@jwt_required()
def complete_profile_details():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body must be JSON"}), 400

    user = get_current_user()
    
    if not user or not user.company:
        return jsonify({"message": "User or company not found"}), 404

    company = user.company

    expected_fields = [
        'address', 'phone', 'website', 'theme_primary_color', 
        'theme_secondary_color', 'theme_accent_color', 'theme_bg_color', 'theme_text_color'
    ]

    for field in expected_fields:
        if field in data:
            setattr(company, field, data[field])

    try:
        db.session.commit()
        return jsonify({
            "message": "Profile details updated successfully.",
            "company_id": company.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"ERROR updating profile details: {e}", exc_info=True)
        return jsonify({"message": "An internal error occurred while updating details."}), 500

@onboarding_blueprint.route("/complete-profile/logo", methods=["POST"])
@jwt_required()
def upload_company_logo_onboarding():
    if 'logo' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    company_id = request.form.get('company_id')
    if not company_id:
        return jsonify({"error": "Company ID is required"}), 400

    file = request.files['logo']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    company = Company.query.get(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    current_user = get_current_user()
    if current_user.company_id != int(company_id):
        return jsonify({"error": "Unauthorized"}), 403

    try:
        s3_service = S3Service()
        # The service handles resizing, uploading, and returns a dict of URLs
        logo_urls = s3_service.upload_logo(file, company.id)

        # Save the correct URLs from the service to the database
        company.logo_original_url = logo_urls.get('original')
        company.logo_large_url = logo_urls.get('large')
        company.logo_medium_url = logo_urls.get('medium')
        # Use 'default' from S3 service for 'small' in the DB model as per user's final reqs
        company.logo_small_url = logo_urls.get('default')

        # Mark the profile as fully complete only after the logo is uploaded
        company.profile_complete = True
        
        db.session.commit()

        # Create a new token that reflects the final profile_complete status
        roles = [role.name for role in current_user.roles]
        new_token = create_access_token(
            identity=str(current_user.id),
            additional_claims={
                "roles": roles,
                "profile_complete": True
            },
            fresh=True
        )

        return jsonify({
            "message": "Logo uploaded successfully and profile is now complete!",
            "access_token": new_token,
            "logo_urls": logo_urls
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"ERROR uploading logo: {e}", exc_info=True)
        # Provide a more specific error message if possible
        return jsonify({"message": f"An internal error occurred during file upload: {e}"}), 500

@onboarding_blueprint.route('/check-status', methods=['GET'])
@jwt_required()
def check_onboarding_status():
    user = get_current_user()
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    # Check if the user is associated with a company
    if not user.company_id:
        return jsonify({
            "has_company": False,
            "profile_complete": False,
            "roles": [role.name for role in user.roles]
        }), 200
        
    return jsonify({
        "has_company": True,
        "company_id": user.company_id,
        "profile_complete": user.company.profile_complete,
        "roles": [role.name for role in user.roles]
    }), 200

@onboarding_blueprint.route('/google/create-company', methods=['POST'])
@jwt_required()
def create_company_google():
    user = get_current_user()
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    if user.company_id:
        return jsonify({"message": "User already associated with a company"}), 400
        
    data = request.get_json()
    company_name = data.get('company_name')
    company_domain = data.get('company_domain')
    
    if not company_name or not company_domain:
        return jsonify({"message": "Company name and domain are required"}), 400
        
    # Check if domain is already taken
    if Company.query.filter_by(domain=company_domain).first():
        return jsonify({"message": "A company with this domain already exists."}), 409
        
    try:
        # Create the new company
        new_company = Company(
            name=company_name,
            domain=company_domain,
            profile_complete=False
        )
        db.session.add(new_company)
        db.session.flush() # Get the ID before committing
        
        # Associate user with company and assign superadmin role
        user.company_id = new_company.id
        
        # Ensure superadmin role exists and assign it
        superadmin_role = Role.query.filter_by(name='superadmin').first()
        if not superadmin_role:
            superadmin_role = Role(name='superadmin')
            db.session.add(superadmin_role)
            db.session.flush()
            
        if superadmin_role not in user.roles:
            user.roles.append(superadmin_role)
            
        db.session.commit()
        
        # Generate a new token with updated roles and company info
        user_roles = [role.name for role in user.roles]
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'roles': user_roles,
                'profile_complete': False
            }
        )
        
        return jsonify({
            "message": "Company created successfully",
            "access_token": access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating company for Google user: {e}", exc_info=True)
        return jsonify({"message": "An error occurred while creating the company."}), 500