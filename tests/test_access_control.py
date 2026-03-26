#!/usr/bin/env python

import pytest
from app import create_app, db
from app.models.user import User
from app.models.role import Role
from app.models.ui_page import UIPage
from app.models.page_permission import PagePermission
from tests.utils import setup_company_users, get_auth_headers

@pytest.fixture(scope='module')
def test_client():
    # Correctly call the app factory with the config name
    flask_app = create_app(config_name='testing')
    with flask_app.test_client() as testing_client:
        with flask_app.app_context():
            db.create_all()
            # Seed initial roles
            db.session.add(Role(name='superadmin'))
            db.session.add(Role(name='admin'))
            db.session.add(Role(name='employee'))
            db.session.commit()
            yield testing_client
            db.drop_all()

def test_role_based_page_access(test_client):
    """
    Test Case: Granular Role-Based Access Control for Dynamic UI Pages
    - A page is created and assigned exclusively to the 'admin' role.
    - Verifies that a superadmin can access it (universal access).
    - Verifies that the assigned admin can access it.
    - Verifies that a non-assigned employee is denied access (403).
    """
    # 1. Setup Company with Admin and Employee using the utility
    admin_email = 'test-admin@access.com'
    employee_email = 'test-employee@access.com'
    company_domain = 'access.com'
    admin, employee, company = setup_company_users(test_client, admin_email, employee_email, company_domain)

    # 2. Setup Superadmin manually
    superadmin_email = 'super@access.com'
    superadmin_role = Role.query.filter_by(name='superadmin').first()
    superadmin = User(email=superadmin_email, company_id=company.id, first_name='Super', last_name='User')
    superadmin.roles.append(superadmin_role)
    db.session.add(superadmin)
    db.session.commit()

    # 3. Get auth headers for all users
    admin_headers = get_auth_headers(test_client, admin.email)
    employee_headers = get_auth_headers(test_client, employee.email)
    superadmin_headers = get_auth_headers(test_client, superadmin.email)

    # 4. As Admin, create a new UIPage for reporting
    admin_role = Role.query.filter_by(name='admin').first()
    financials_page = UIPage(
        name='Financials Dashboard',
        company_id=company.id,
        route='/reports/financials'
    )
    db.session.add(financials_page)
    db.session.commit()

    # 5. Assign this page ONLY to the 'admin' role
    page_permission = PagePermission(page_id=financials_page.id, role_id=admin_role.id)
    db.session.add(page_permission)
    db.session.commit()

    # 6. Mock a generic page access endpoint for the test
    @test_client.application.route('/api/v1/ui/page<path:page_route>')
    def get_page_data(page_route):
        from flask_jwt_extended import jwt_required, get_current_user
        
        current_user = get_current_user()
        page = UIPage.query.filter_by(route=page_route, company_id=current_user.company_id).first_or_404()
        
        # Check permissions
        if not page.is_accessible_by(current_user):
            return {'message': 'You do not have permission to access this page'}, 403

        return {'message': f'Welcome to {page.name}'}, 200

    # 7. Verify Superadmin CAN access the page
    superadmin_res = test_client.get('/api/v1/ui/page/reports/financials', headers=superadmin_headers)
    assert superadmin_res.status_code == 200
    print(f"\nSUCCESS: Superadmin user '{superadmin.email}' was correctly GRANTED access to {financials_page.route}.")

    # 8. Verify Admin CAN access the page
    admin_res = test_client.get('/api/v1/ui/page/reports/financials', headers=admin_headers)
    assert admin_res.status_code == 200
    print(f"SUCCESS: Admin user '{admin.email}' was correctly GRANTED access to {financials_page.route}.")

    # 9. Verify Employee CANNOT access the page
    employee_res = test_client.get('/api/v1/ui/page/reports/financials', headers=employee_headers)
    assert employee_res.status_code == 403
    print(f"SUCCESS: Employee user '{employee.email}' was correctly DENIED access to {financials_page.route}.")
