from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models.user import User
from app.models.role import Role
from app.models.company import Company
from flask_jwt_extended import create_access_token

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    required_fields = ['company_name', 'company_domain', 'email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({'message': 'Missing required fields'}), 400

    # Corrected the line break to be Python-compliant
    if (Company.query.filter_by(domain=data['company_domain']).first() or
            User.query.filter_by(email=data['email']).first()):
        return jsonify({'message': 'A company with this domain or email already exists.'}), 409

    for role_name in ['superadmin', 'admin', 'employee']:
        if not Role.query.filter_by(name=role_name).first():
            db.session.add(Role(name=role_name))
    db.session.commit()

    new_company = Company(
        name=data['company_name'], 
        domain=data['company_domain'],
        profile_complete=False
    )
    db.session.add(new_company)
    db.session.commit()

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    superadmin_role = Role.query.filter_by(name='superadmin').first()
    
    new_user = User(
        first_name="Admin", 
        last_name="User",
        email=data['email'], 
        password_hash=hashed_password, 
        company_id=new_company.id,
        status='active'
    )
    new_user.roles.append(superadmin_role)
    db.session.add(new_user)
    db.session.commit()

    user_roles = [role.name for role in new_user.roles]
    access_token = create_access_token(
        identity=str(new_user.id), 
        additional_claims={
            'roles': user_roles,
            'profile_complete': new_company.profile_complete
        }
    )
    
    return jsonify(access_token=access_token), 201


@auth_blueprint.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email'], status='active').first()

    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        user_roles = [role.name for role in user.roles]
        profile_complete = user.company.profile_complete if user.company else False
        
        access_token = create_access_token(
            identity=str(user.id), 
            additional_claims={
                'roles': user_roles,
                'profile_complete': profile_complete
            }
        )
        return jsonify(access_token=access_token), 200

    return jsonify({'message': 'Invalid credentials'}), 401


@auth_blueprint.route('/check-availability', methods=['POST'])
def check_availability():
    """Checks if a company domain or user email is already taken."""
    data = request.get_json()
    field = data.get('field')
    value = data.get('value')

    if not field or not value:
        return jsonify({'message': 'Field and value are required'}), 400

    available = False
    if field == 'domain':
        if not Company.query.filter_by(domain=value).first():
            available = True
    elif field == 'email':
        if not User.query.filter_by(email=value).first():
            available = True
    else:
        return jsonify({'message': 'Invalid field specified'}), 400

    return jsonify({'available': available}), 200


@auth_blueprint.route('/accept-invitation', methods=['POST'])
def accept_invitation():
    data = request.get_json()
    user = User.query.filter_by(invitation_token=data['token'], status='invited').first()

    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 404

    user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user.status = 'active'
    user.invitation_token = None
    db.session.commit()

    return jsonify({'message': 'Account activated successfully'}), 200
