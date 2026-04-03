from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user, get_jwt_identity
from app import db
from app.models.company import Company
from app.models.user import User
from app.utils.s3 import upload_file
from app.decorators import roles_required
from werkzeug.utils import secure_filename
import os

uploads_bp = Blueprint('uploads', __name__)

@uploads_bp.route("/company-logo", methods=["POST"])
@jwt_required()
@roles_required('superadmin')
def upload_company_logo():
    if 'logo' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['logo']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        bucket_name = os.environ.get('AWS_S3_BUCKET')
        original_url = upload_file(file, bucket_name, f"logos/{current_user.company_id}/original/{filename}")
        
        medium_url = original_url 
        small_url = original_url 

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

@uploads_bp.route('/user-avatar', methods=['POST'])
@jwt_required()
def upload_user_avatar():
    try:
        user_id = get_jwt_identity()
        if 'avatar' not in request.files:
            return jsonify({'message': 'No file part', 'success': False}), 400

        file = request.files['avatar']
        if file.filename == '':
            return jsonify({'message': 'No selected file', 'success': False}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found', 'success': False}), 404

        bucket_name = os.environ.get('AWS_S3_BUCKET')
        file_url = upload_file(file, bucket_name, f"user_avatars/{user_id}/{secure_filename(file.filename)}")

        if file_url:
            user.avatar_original_url = file_url
            user.avatar_medium_url = file_url
            user.avatar_small_url = file_url
            db.session.commit()
            
            return jsonify({
                'message': 'Avatar uploaded successfully',
                'success': True,
                'avatar_original_url': user.avatar_original_url
            }), 200

        return jsonify({'message': 'Upload failed', 'success': False}), 400

    except Exception as e:
        print(f"Error in avatar upload: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}', 'success': False}), 500

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'webp'}
