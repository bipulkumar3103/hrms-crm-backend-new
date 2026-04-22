from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.employee import Employee
import logging

logger = logging.getLogger(__name__)

employees_blueprint = Blueprint('employees', __name__)

@employees_blueprint.route('/all', methods=['GET'])
@jwt_required()
def get_employees():
    try:
        from app.models.user import User
        user_id = get_jwt_identity()
        current_user = User.query.get(int(user_id))
        if not current_user:
            return jsonify({'message': 'User not found'}), 404

        logger.info(f"Fetching employees for company_id={current_user.company_id}")

        # Fetch all users belonging to the same company
        users_in_company = User.query.filter_by(company_id=current_user.company_id).all()
        
        employee_data = []
        for u in users_in_company:
            employee_data.append({
                'id': u.id,
                'name': f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email,
                'email': u.email,
                'department': u.dept_relationship.name if u.dept_relationship else (u.department or 'Unassigned'),
                'job_title': u.designation_relationship.name if u.designation_relationship else (u.job_title or 'Employee'),
                'department_id': u.department_id,
                'designation_id': u.designation_id,
                'manager_id': u.manager_id,
                'manager_name': f"{u.manager.first_name} {u.manager.last_name}" if u.manager else "Unassigned / Direct Report",
                'status': u.status,
                'is_privileged': u.is_admin_or_super,
                'roles': [r.name for r in u.roles],
                'organization': {
                    'department': {
                        'id': u.department_id,
                        'name': u.dept_relationship.name if u.dept_relationship else u.department
                    } if u.department_id or u.department else None,
                    'designation': {
                        'id': u.designation_id,
                        'name': u.designation_relationship.name if u.designation_relationship else u.job_title
                    } if u.designation_id or u.job_title else None
                }
            })
        
        logger.info(f"Returning {len(employee_data)} employees")
        return jsonify(employee_data), 200

    except Exception as e:
        logger.error(f"Error in get_employees: {str(e)}", exc_info=True)
        return jsonify({'message': f'Server error: {str(e)}'}), 500