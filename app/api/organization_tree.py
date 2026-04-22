from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.organization import Department, Designation
from app.models.timesheet import Project, ProjectAssignment

org_tree_blueprint = Blueprint('organization_tree', __name__)

@org_tree_blueprint.route('/tree', methods=['GET'])
@jwt_required()
def get_organization_tree():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    company_id = current_user.company_id
    users = User.query.filter_by(company_id=company_id).all()
    
    user_map = {}
    for user in users:
        user_map[user.id] = {
            'id': user.id,
            'name': f"{user.first_name} {user.last_name}" if user.first_name else user.email,
            'email': user.email,
            'phone': user.phone_number,
            'location': user.location or "Global",
            'job_title': user.designation_relationship.name if user.designation_relationship else (user.job_title or "Team Member"),
            'department': user.dept_relationship.name if user.dept_relationship else (user.department or "General"),
            'avatar': user.avatar_small_url,
            'status': user.status or "active",
            'manager_id': user.manager_id,
            'team_size': user.reports.count(),
            'reports': []
        }
    roots = []
    for user_id, user_data in user_map.items():
        manager_id = user_data['manager_id']
        if manager_id and manager_id in user_map:
            user_map[manager_id]['reports'].append(user_data)
        else:
            roots.append(user_data)
    return jsonify(roots), 200

@org_tree_blueprint.route('/department-tree', methods=['GET'])
@jwt_required()
def get_department_tree():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    company_id = current_user.company_id
    departments = Department.query.filter_by(company_id=company_id).all()
    if not departments:
        departments = Department.query.filter_by(is_global=True).all()
    
    users = User.query.filter_by(company_id=company_id).all()
    roots = []
    
    for dept in departments:
        dept_id_str = f'dept-{dept.id}'
        dept_node = {
            'id': dept_id_str,
            'name': dept.name,
            'type': 'department',
            'reports': []
        }
        
        designations = Designation.query.filter_by(department_id=dept.id).all()
        for desig in designations:
            desig_id_str = f'{dept_id_str}-desig-{desig.id}'
            desig_node = {
                'id': desig_id_str,
                'name': desig.name,
                'type': 'designation',
                'reports': []
            }
            
            desig_users = [u for u in users if u.department_id == dept.id and u.designation_id == desig.id]
            for user in desig_users:
                # IMPORTANT: Unique ID for employees in structure view to prevent React Flow ID collisions
                unique_emp_id = f'{desig_id_str}-emp-{user.id}'
                desig_node['reports'].append({
                    'id': unique_emp_id,
                    'real_id': user.id, # Keep track of actual user ID
                    'name': f"{user.first_name} {user.last_name}",
                    'email': user.email,
                    'phone': user.phone_number,
                    'location': user.location or "Global",
                    'job_title': desig.name if desig else user.job_title,
                    'department': dept.name,
                    'avatar': user.avatar_small_url,
                    'status': user.status or "active",
                    'team_size': user.reports.count(),
                    'type': 'employee'
                })
            
            if desig_node['reports']:
                dept_node['reports'].append(desig_node)
        
        if dept_node['reports']:
            roots.append(dept_node)
            
    return jsonify(roots), 200
