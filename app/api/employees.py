from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.decorators import roles_required
from app.models.employee import Employee

employees_blueprint = Blueprint('employees', __name__)

@employees_blueprint.route('/', methods=['GET'])
@jwt_required()
@roles_required('superadmin', 'admin')
def get_employees():
    # This is a placeholder for future functionality
    employees = Employee.query.all()
    return jsonify([employee.id for employee in employees]), 200