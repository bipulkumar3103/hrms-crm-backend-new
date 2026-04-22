from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.organization import Department, Designation
import logging

logger = logging.getLogger(__name__)

organization_blueprint = Blueprint('organization', __name__)

def can_manage_org(user):
    """
    Governance Logic:
    1. Admin/Superadmin Roles can manage everything.
    2. HR Personnel with 'hradmin' designation can manage all departments and designations.
    """
    if user.is_admin_or_super:
        return True
    
    # Check for HR Department Head (hradmin)
    if user.is_hr:
        if user.designation_relationship and user.designation_relationship.name.lower() == 'hradmin':
            return True
            
    return False

@organization_blueprint.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    # List departments for this company + global ones
    departments = Department.query.filter(
        (Department.company_id == user.company_id) | (Department.is_global == True)
    ).all()

    output = []
    for dept in departments:
        output.append({
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "is_global": dept.is_global,
            "designations": [
                {"id": d.id, "name": d.name, "is_default": d.is_default} 
                for d in dept.designations
            ]
        })

    return jsonify(output), 200

@organization_blueprint.route('/departments', methods=['POST'])
@jwt_required()
def create_department():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not can_manage_org(user):
        return jsonify({"message": "Insufficient governance permissions"}), 403

    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    is_global = data.get('is_global', False)

    if not name:
        return jsonify({"message": "Department name is required"}), 400

    new_dept = Department(
        name=name,
        description=description,
        company_id=user.company_id if not is_global else None,
        is_global=is_global if user.has_role('superadmin') else False # Only superadmins can create global depts
    )

    db.session.add(new_dept)
    db.session.commit()

    return jsonify({"message": "Department created", "id": new_dept.id}), 201

@organization_blueprint.route('/designations', methods=['POST'])
@jwt_required()
def create_designation():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not can_manage_org(user):
        return jsonify({"message": "Insufficient governance permissions"}), 403

    data = request.get_json()
    dept_id = data.get('department_id')
    name = data.get('name')
    description = data.get('description', '')
    is_default = data.get('is_default', False)

    if not all([dept_id, name]):
        return jsonify({"message": "Department ID and Name are required"}), 400

    # Ensure dept exists and belongs to company (or is global)
    dept = Department.query.get(dept_id)
    if not dept or (dept.company_id != user.company_id and not dept.is_global):
        return jsonify({"message": "Target department not found or inaccessible"}), 404

    new_desig = Designation(
        department_id=dept_id,
        name=name,
        description=description,
        is_default=is_default
    )

    db.session.add(new_desig)
    db.session.commit()

    return jsonify({"message": "Designation created", "id": new_desig.id}), 201

# --- Manage Routes ---

@organization_blueprint.route('/departments/<int:id>', methods=['PUT'])
@jwt_required()
def update_department(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not can_manage_org(user):
        return jsonify({"message": "Forbidden"}), 403

    dept = Department.query.get(id)
    if not dept:
        return jsonify({"message": "Department not found"}), 404

    data = request.get_json()
    old_name = dept.name
    
    if 'name' in data: dept.name = data['name']
    if 'description' in data: dept.description = data['description']
    
    # Synchronize legacy string fields for all associated employees
    if 'name' in data and dept.name != old_name:
        # 1. Update strict relational profiles
        for user in dept.users:
            user.department = dept.name
            
        # 2. Heal and convert legacy loose-string profiles
        legacy_matched_users = User.query.filter(User.department.ilike(old_name)).all()
        for l_user in legacy_matched_users:
            l_user.department = dept.name
            l_user.department_id = dept.id # Auto-convert to strict relational mode!
            
    db.session.commit()
    return jsonify({"message": "Department updated"}), 200

@organization_blueprint.route('/departments/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_department(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not can_manage_org(user):
        return jsonify({"message": "Forbidden"}), 403

    dept = Department.query.get(id)
    if not dept:
        return jsonify({"message": "Department not found"}), 404

    # Security: Don't delete if it has designations or users
    if dept.designations.count() > 0 or dept.users.count() > 0:
        return jsonify({"message": "Cannot delete department with active designations or users"}), 400

    db.session.delete(dept)
    db.session.commit()
    return jsonify({"message": "Department deleted"}), 200

@organization_blueprint.route('/designations/<int:id>', methods=['PUT'])
@jwt_required()
def update_designation(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not can_manage_org(user):
        return jsonify({"message": "Forbidden"}), 403

    desig = Designation.query.get(id)
    if not desig:
        return jsonify({"message": "Designation not found"}), 404

    data = request.get_json()
    old_name = desig.name
    
    if 'name' in data: desig.name = data['name']
    if 'description' in data: desig.description = data['description']
    if 'is_default' in data: desig.is_default = data['is_default']
    
    # Synchronize legacy string fields for all associated employees
    if 'name' in data and desig.name != old_name:
        # 1. Update strict relational profiles
        for user in desig.users:
            user.job_title = desig.name
            
        # 2. Heal and convert legacy loose-string profiles
        legacy_matched_users = User.query.filter(User.job_title.ilike(old_name)).all()
        for l_user in legacy_matched_users:
            l_user.job_title = desig.name
            l_user.designation_id = desig.id # Auto-convert to strict relational mode!
            
    db.session.commit()
    return jsonify({"message": "Designation updated"}), 200

@organization_blueprint.route('/designations/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_designation(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not can_manage_org(user):
        return jsonify({"message": "Forbidden"}), 403

    desig = Designation.query.get(id)
    if not desig:
        return jsonify({"message": "Designation not found"}), 404

    # Security: Don't delete if it has users
    if desig.users.count() > 0:
        return jsonify({"message": "Cannot delete designation with active users assigned"}), 400

    db.session.delete(desig)
    db.session.commit()
    return jsonify({"message": "Designation deleted"}), 200
