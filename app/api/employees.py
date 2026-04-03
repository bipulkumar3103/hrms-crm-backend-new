from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.employee import Employee
import logging

logger = logging.getLogger(__name__)

employees_blueprint = Blueprint('employees', __name__)

@employees_blueprint.route('/', methods=['GET'], strict_slashes=False)
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
                'department': u.department or 'Unassigned',
                'job_title': u.job_title or 'Employee',
                'status': u.status
            })
        
        logger.info(f"Returning {len(employee_data)} employees")
        return jsonify(employee_data), 200

    except Exception as e:
        logger.error(f"Error in get_employees: {str(e)}", exc_info=True)
        return jsonify({'message': f'Server error: {str(e)}'}), 500