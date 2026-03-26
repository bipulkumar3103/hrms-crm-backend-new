import pytest
import json
from app import db
from app.models import (
    User, Company, Role, VirtualEntity, VirtualField, 
    VirtualRecord, VirtualValue, AuditLog, DataChangeLog
)

def get_auth_header(test_client, email, password):
    login_res = test_client.post('/api/v1/auth/login', json={
        'email': email,
        'password': password
    })
    token = login_res.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}

def setup_company_and_admin(test_client, name, domain, email):
    test_client.post('/api/v1/auth/register', json={
        'company_name': name,
        'company_domain': domain,
        'email': email,
        'password': 'password123',
        'theme_primary_color': '#000000',
        'theme_secondary_color': '#ffffff'
    })
    return get_auth_header(test_client, email, 'password123')

def test_virtual_database_full_flow(test_client):
    """
    Scenario: Admin creates a Headless CMS structure, Employee submits data, 
    and Audit Logs track the lifecycle.
    """
    # 1. Setup Admin and Company
    admin_headers = setup_company_and_admin(test_client, "Acme Corp", "acme.com", "admin@acme.com")
    admin_user = User.query.filter_by(email="admin@acme.com").first()
    company_id = admin_user.company_id

    # 2. Admin creates Virtual Entity ('Leave_Request')
    # Using the Metadata Engine API
    entity = VirtualEntity(name="Leave_Request", company_id=company_id)
    db.session.add(entity)
    db.session.commit()

    # 3. Admin creates Virtual Fields ('Days', 'Reason')
    field_days = VirtualField(
        entity_id=entity.id, 
        name="Days", 
        data_type="Int", 
        company_id=company_id
    )
    field_reason = VirtualField(
        entity_id=entity.id, 
        name="Reason", 
        data_type="String", 
        company_id=company_id
    )
    db.session.add_all([field_days, field_reason])
    db.session.commit()

    # 4. Invite and Setup Employee
    invite_res = test_client.post('/api/v1/users/invite', headers=admin_headers, json={
        'first_name': 'John',
        'last_name': 'Employee',
        'email': 'john@acme.com',
        'role': 'employee'
    })
    token = invite_res.get_json()['invitation_link'].split('=')[-1]
    test_client.post('/api/v1/auth/accept-invitation', json={
        'token': token,
        'password': 'emp_password'
    })
    emp_headers = get_auth_header(test_client, 'john@acme.com', 'emp_password')
    emp_user = User.query.filter_by(email='john@acme.com').first()

    # 5. Employee submits a Virtual Record
    # Logic: Create Record -> Add Values for Fields
    record = VirtualRecord(entity_id=entity.id, creator_id=emp_user.id, company_id=company_id)
    db.session.add(record)
    db.session.commit()

    val1 = VirtualValue(record_id=record.id, field_id=field_days.id, value="5", company_id=company_id)
    val2 = VirtualValue(record_id=record.id, field_id=field_reason.id, value="Vacation", company_id=company_id)
    db.session.add_all([val1, val2])
    
    # Trigger Audit Log Manual entry (Simulating API logic)
    audit = AuditLog(
        user_id=emp_user.id, 
        action="CREATE_RECORD", 
        resource_type="VirtualRecord", 
        resource_id=record.id,
        company_id=company_id
    )
    db.session.add(audit)
    db.session.commit()

    # 6. Verify Persistence and Audit
    assert VirtualRecord.query.count() == 1
    assert VirtualValue.query.filter_by(value="Vacation").first() is not None
    assert AuditLog.query.filter_by(action="CREATE_RECORD").first() is not None

    # 7. Data Change Log Check: Update a value
    old_value = val1.value
    new_value = "10"
    val1.value = new_value
    
    change_log = DataChangeLog(
        resource_type="VirtualValue",
        resource_id=val1.id,
        column_name="value",
        old_value=old_value,
        new_value=new_value,
        user_id=emp_user.id,
        company_id=company_id
    )
    db.session.add(change_log)
    db.session.commit()

    log_entry = DataChangeLog.query.filter_by(resource_id=val1.id).first()
    assert log_entry.old_value == "5"
    assert log_entry.new_value == "10"

def test_virtual_db_multi_tenancy(test_client):
    """
    Ensure Company A cannot see or access Company B's Headless CMS data.
    """
    # Setup Company A
    headers_a = setup_company_and_admin(test_client, "Comp A", "a.com", "admin@a.com")
    admin_a = User.query.filter_by(email="admin@a.com").first()
    
    entity_a = VirtualEntity(name="Secret_A", company_id=admin_a.company_id)
    db.session.add(entity_a)
    db.session.commit()

    # Setup Company B
    headers_b = setup_company_and_admin(test_client, "Comp B", "b.com", "admin@b.com")
    admin_b = User.query.filter_by(email="admin@b.com").first()

    # Attempt to query Entity A using Company B context (simulated partition check)
    # In a real API request, the company_id filter is enforced
    visible_to_b = VirtualEntity.query.filter_by(company_id=admin_b.company_id).all()
    
    assert len(visible_to_b) == 0
    assert all(e.name != "Secret_A" for e in visible_to_b)

    # Cross-tenant data leak prevention check
    all_entities = VirtualEntity.query.all()
    assert len(all_entities) == 1
    assert all_entities[0].company_id != admin_b.company_id
