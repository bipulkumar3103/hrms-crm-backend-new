from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.user import User
from app.models.role import Role
from app.models.employee import Employee
from app.decorators import roles_required
from flask_jwt_extended import get_jwt_identity

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
    
    # Dynamic invitation link using request.host_url
    invitation_link = f"{request.host_url}accept-invitation?token={new_user.invitation_token}"

    return jsonify({
        'message': f'User successfully invited as {role_name}',
        'invitation_link': invitation_link
    }), 201