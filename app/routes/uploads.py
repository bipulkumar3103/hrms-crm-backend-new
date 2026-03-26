
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from app import db
from app.models.company import Company
from app.utils.s3 import upload_file
from werkzeug.utils import secure_filename
import os

# Blueprint for handling uploads
uploads_bp = Blueprint('uploads', __name__)

@uploads_bp.route("/company-logo", methods=["POST"])
@jwt_required()
def upload_company_logo():
    if 'logo' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['logo']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        
        # Upload original file to S3
        original_url = upload_file(file, os.environ.get('S3_BUCKET_NAME'), f"logos/{current_user.company_id}/original/{filename}")
        
        # For simplicity, we're not resizing here, but in a real app you would.
        # Let's assume the frontend provides resized images or we use a lambda for resizing.
        medium_url = original_url # Placeholder
        small_url = original_url # Placeholder

        company = Company.query.get(current_user.company_id)
        company.logo_original_url = original_url
        company.logo_medium_url = medium_url
        company.logo_small_url = small_url
        db.session.commit()

        return jsonify({
            "original_url": original_url,
            "medium_url": medium_url,
            "small_url": small_url
        }), 200

    return jsonify({"error": "File type not allowed"}), 400

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}
