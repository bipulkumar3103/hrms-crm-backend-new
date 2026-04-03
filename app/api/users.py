from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.role import Role
from app.models.employee import Employee
from app.models.company import Company
from app.decorators import roles_required
from app.services.mail_service import send_invitation_email

users_blueprint = Blueprint('users', __name__)

@users_blueprint.route('/invite', methods=['POST'])
@jwt_required()
@roles_required('superadmin', 'admin')
def invite_user():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    role_name = data.get('role')

    if not all([first_name, last_name, email, role_name]):
        return jsonify({'error': 'All fields are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email is already in use'}), 409

    if role_name not in ['admin', 'employee']:
        return jsonify({'error': 'Invalid role specified'}), 400

    inviting_user_id = get_jwt_identity()
    inviting_user = User.query.get(inviting_user_id)

    if role_name == 'admin' and not inviting_user.has_role('superadmin'):
        return jsonify({'error': 'Only superadmins can invite new admins'}), 403

    role = Role.query.filter_by(name=role_name).first()

    new_user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        company_id=inviting_user.company_id,
        status='invited'
    )
    new_user.generate_invitation_token()
    new_user.roles.append(role)

    if role_name == 'employee':
        employee_record = Employee(user=new_user)
        db.session.add(employee_record)

    db.session.add(new_user)
    db.session.commit()

    # Build the invitation link
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    invitation_link = f"{frontend_url}/accept-invitation?token={new_user.invitation_token}"

    # --- Attempt to send email if company SMTP is configured ---
    company = Company.query.get(inviting_user.company_id)
    email_sent, email_msg = send_invitation_email(
        company=company,
        recipient_email=email,
        recipient_name=first_name,
        invitation_link=invitation_link,
        role_name=role_name
    )

    return jsonify({
        'message': f'User successfully invited as {role_name}',
        'invitation_link': invitation_link,
        'email_sent': email_sent,
        'email_status': email_msg
    }), 201

@users_blueprint.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    return jsonify({
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'phone_number': user.phone_number,
        'job_title': user.job_title,
        'department': user.department,
        'location': user.location,
        'avatar_original_url': user.avatar_original_url,
        'avatar_medium_url': user.avatar_medium_url,
        'avatar_small_url': user.avatar_small_url,
        'dob': user.dob,
        'address_temporary': user.address_temporary,
        'address_permanent': user.address_permanent,
        'pan_number': user.pan_number,
        'aadhar_number': user.aadhar_number,
        'uan': user.uan,
        'status': user.status,
        'roles': [r.name for r in user.roles]
    }), 200

@users_blueprint.route('/me', methods=['PUT'])
@jwt_required()
def update_my_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    data = request.get_json()
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone_number' in data: user.phone_number = data['phone_number']
    if 'job_title' in data: user.job_title = data['job_title']
    if 'department' in data: user.department = data['department']
    if 'location' in data: user.location = data['location']
    if 'dob' in data: user.dob = data['dob']
    if 'address_temporary' in data: user.address_temporary = data['address_temporary']
    if 'address_permanent' in data: user.address_permanent = data['address_permanent']
    if 'pan_number' in data: user.pan_number = data['pan_number']
    if 'aadhar_number' in data: user.aadhar_number = data['aadhar_number']
    if 'uan' in data: user.uan = data['uan']
        
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone_number': user.phone_number,
        'job_title': user.job_title,
        'department': user.department,
        'location': user.location,
        'dob': user.dob,
        'address_temporary': user.address_temporary,
        'address_permanent': user.address_permanent,
        'pan_number': user.pan_number,
        'aadhar_number': user.aadhar_number,
        'uan': user.uan
    }), 200