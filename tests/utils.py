#!/usr/bin/env python

from flask_jwt_extended import create_access_token
from app import db
from app.models.user import User
from app.models.company import Company
from app.models.role import Role

def get_auth_headers(test_client, email):
    """
    Generates a JWT token for a given user email and returns authorization headers.
    """
    access_token = create_access_token(identity=email)
    return {'Authorization': f'Bearer {access_token}'}

def setup_company_users(test_client, admin_email, employee_email, company_domain):
    """
    Sets up a company with an admin and an employee for testing purposes.
    """
    # 1. Ensure roles exist
    admin_role = Role.query.filter_by(name='admin').first()
    if not admin_role:
        admin_role = Role(name='admin')
        db.session.add(admin_role)

    employee_role = Role.query.filter_by(name='employee').first()
    if not employee_role:
        employee_role = Role(name='employee')
        db.session.add(employee_role)
    
    db.session.commit()

    # 2. Create Company
    company = Company.query.filter_by(domain=company_domain).first()
    if not company:
        company = Company(name=f"{company_domain} Inc.", domain=company_domain)
        db.session.add(company)
        db.session.commit()

    # 3. Create Admin User
    admin_user = User.query.filter_by(email=admin_email).first()
    if not admin_user:
        admin_user = User(email=admin_email, company_id=company.id, first_name='Test', last_name='Admin')
        admin_user.roles.append(admin_role)
        db.session.add(admin_user)

    # 4. Create Employee User
    employee_user = User.query.filter_by(email=employee_email).first()
    if not employee_user:
        employee_user = User(email=employee_email, company_id=company.id, first_name='Test', last_name='Employee')
        employee_user.roles.append(employee_role)
        db.session.add(employee_user)
    
    db.session.commit()

    return admin_user, employee_user, company
