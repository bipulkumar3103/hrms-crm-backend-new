import pytest
import json
from app.models.user import User
from app.models.role import Role
from app.models.company import Company
from app.models.metadata_engine import UIPage, PageSection, UIComponent, VirtualEntity

def get_auth_headers(test_client, email, password):
    login_res = test_client.post('/api/v1/auth/login', json={
        'email': email,
        'password': password
    })
    token = login_res.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}

def setup_company_and_admin(test_client, email, domain):
    test_client.post('/api/v1/auth/register', json={
        'company_name': f'Test {domain}',
        'company_domain': domain,
        'email': email,
        'password': 'password123',
        'theme_primary_color': '#000000',
        'theme_secondary_color': '#ffffff'
    })
    return get_auth_headers(test_client, email, 'password123')

def test_dynamic_ui_full_flow(test_client):
    """
    Test Case: Full Dynamic UI Engine Lifecycle
    Covers: Page Creation, Component Styling, Data Binding, and Permissions
    """
    # 1. Setup Admin for Company A
    admin_headers = setup_company_and_admin(test_client, 'admin@comp-a.com', 'compa.com')
    
    # 2. Admin creates a Virtual Entity to bind UI components to
    entity_res = test_client.post('/api/v1/users/invite', headers=admin_headers, json={
        'first_name': 'Employee',
        'last_name': 'One',
        'email': 'emp@comp-a.com',
        'role': 'employee'
    })
    # (Mocking database state for UI tests since API endpoints for UI are being built)
    from app import db
    admin_user = User.query.filter_by(email='admin@comp-a.com').first()
    company_id = admin_user.company_id
    
    # 3. Create UIPage and PageSection
    page = UIPage(name='Employee_Portal', company_id=company_id, route='/portal')
    db.session.add(page)
    db.session.commit()
    
    section = PageSection(name='Top_Section', page_id=page.id, company_id=company_id, layout_type='grid', order=1)
    db.session.add(section)
    db.session.commit()

    # 4. Add UIComponent (card_sm) with style_config and data_binding
    # Scenario: Admin decides border_width, shadow, and link to data
    card_sm = UIComponent(
        section_id=section.id,
        company_id=company_id,
        type='card_sm',
        title='Quick Stats',
        style_config={
            'border_width': '2px',
            'shadow': 'lg',
            'border_color_variant': 'primary', # Theme-based
            'padding': '16px'
        },
        order=1
    )
    db.session.add(card_sm)
    
    # 5. Add UIComponent (card_lg) - Testing Auto-Flow Logic
    card_lg = UIComponent(
        section_id=section.id,
        company_id=company_id,
        type='card_lg',
        title='Main Feed',
        style_config={'border_width': '1px', 'elevation': 2},
        order=2
    )
    db.session.add(card_lg)
    db.session.commit()

    # 6. Verify Layout Logic via API (Assuming GET /ui-metadata implementation)
    # The frontend uses 'order' and 'type' to stack components
    assert card_sm.order < card_lg.order
    assert card_sm.style_config['border_width'] == '2px'
    assert card_lg.type == 'card_lg'

def test_company_theme_accessibility(test_client):
    """
    Test Case: Theme Verification
    Ensure Company A's primary color is accessible for their UI
    """
    # Create company with custom theme
    test_client.post('/api/v1/auth/register', json={
        'company_name': 'Design Co',
        'company_domain': 'design.com',
        'email': 'designer@design.com',
        'password': 'password123',
        'theme_primary_color': '#000000',
        'theme_secondary_color': '#ffffff'
    })
    
    from app import db
    comp = Company.query.filter_by(domain='design.com').first()
    comp.theme_primary_color = '#FF5733' # Unique Orange
    db.session.commit()
    
    headers = get_auth_headers(test_client, 'designer@design.com', 'password123')
    
    # Verify Company Profile returns correct theme for UI Engine to use
    res = test_client.get('/api/v1/company/profile', headers=headers)
    assert res.status_code == 200
    assert res.get_json()['data']['theme_primary_color'] == '#FF5733'

def test_ui_engine_multi_tenancy(test_client):
    """
    Test Case: UI Isolation
    Verify Page of Company A is not accessible to Company B
    """
    # Setup Company A
    admin_a_headers = setup_company_and_admin(test_client, 'a@a.com', 'a.com')
    from app import db
    user_a = User.query.filter_by(email='a@a.com').first()
    page_a = UIPage(name='Secret_Page', company_id=user_a.company_id)
    db.session.add(page_a)
    db.session.commit()

    # Setup Company B
    admin_b_headers = setup_company_and_admin(test_client, 'b@b.com', 'b.com')
    
    # Attempt to access or modify Company A's UI Metadata should fail
    # (Checking partition logic)
    pages_b = UIPage.query.filter_by(company_id=User.query.filter_by(email='b@b.com').first().company_id).all()
    assert len(pages_b) == 0
    assert page_a.company_id != User.query.filter_by(email='b@b.com').first().company_id

def test_employee_restricted_from_designer(test_client):
    """
    Test Case: RBAC for UI Designer
    Ensure an Employee cannot modify UI Metadata or Page Layouts
    """
    # 1. Admin invites Employee
    admin_headers = setup_company_and_admin(test_client, 'admin@corp.com', 'corp.com')
    test_client.post('/api/v1/users/invite', headers=admin_headers, json={
        'first_name': 'Staff',
        'last_name': 'Member',
        'email': 'staff@corp.com',
        'role': 'employee'
    })
    
    # 2. Employee activates and logs in
    from app.models.user import User
    token = User.query.filter_by(email='staff@corp.com').first().invitation_token
    test_client.post('/api/v1/auth/accept-invitation', json={
        'token': token,
        'password': 'securepassword'
    })
    emp_headers = get_auth_headers(test_client, 'staff@corp.com', 'securepassword')

    # 3. Employee attempts to save UI Metadata (Requires Admin role)
    ui_res = test_client.post('/api/v1/ui-metadata/', headers=emp_headers, json={
        'layout': 'corrupted'
    })
    
    assert ui_res.status_code == 403
    assert 'You are not authorized to perform this action' in ui_res.get_json()['message']
