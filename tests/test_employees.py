import json
from app.models.user import User

def test_invite_employee_success(test_client):
    """
    GIVEN a logged-in user
    WHEN a POST request is made to /api/v1/users/invite with valid data
    THEN the response should be 201 and contain an invitation link
    """
    # Register and log in to get a token
    test_client.post('/api/v1/auth/register', json={
        'company_name': 'Test Co',
        'company_domain': 'test.com',
        'email': 'admin@test.com',
        'password': 'password',
        'theme_primary_color': '#123456',
        'theme_secondary_color': '#654321'
    })
    login_response = test_client.post('/api/v1/auth/login', json={
        'email': 'admin@test.com',
        'password': 'password'
    })
    access_token = login_response.get_json()['access_token']

    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = test_client.post('/api/v1/users/invite', headers=headers, json={
        'first_name': 'Jane',
        'last_name': 'Doe',
        'email': 'jane.doe@test.com',
        'role': 'employee'
    })

    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['message'] == 'User successfully invited as employee'
    assert 'invitation_link' in json_data

def test_accept_invitation_success(test_client):
    """
    GIVEN a valid invitation token
    WHEN a POST request is made to /api/v1/auth/accept-invitation
    THEN the employee's account should be activated
    """
    # First, invite an employee to get a token
    test_client.post('/api/v1/auth/register', json={
        'company_name': 'Accept Co',
        'company_domain': 'accept.com',
        'email': 'admin@accept.com',
        'password': 'password',
        'theme_primary_color': '#abcdef',
        'theme_secondary_color': '#fedcba'
    })
    login_response = test_client.post('/api/v1/auth/login', json={
        'email': 'admin@accept.com',
        'password': 'password'
    })
    access_token = login_response.get_json()['access_token']
    headers = {'Authorization': f'Bearer {access_token}'}
    invite_response = test_client.post('/api/v1/users/invite', headers=headers, json={
        'first_name': 'John',
        'last_name': 'Smith',
        'email': 'john.smith@accept.com',
        'role': 'employee'
    })
    invitation_link = invite_response.get_json()['invitation_link']
    token = invitation_link.split('=')[-1]

    # Now, accept the invitation
    response = test_client.post('/api/v1/auth/accept-invitation', json={
        'token': token,
        'password': 'newpassword'
    })

    assert response.status_code == 200
    assert response.get_json()['message'] == 'Account activated successfully'

    # Verify the user is active
    user = User.query.filter_by(email='john.smith@accept.com').first()
    assert user.status == 'active'

def test_accept_invitation_invalid_token(test_client):
    """
    GIVEN an invalid invitation token
    WHEN a POST request is made to /api/v1/auth/accept-invitation
    THEN the response should be 404
    """
    response = test_client.post('/api/v1/auth/accept-invitation', json={
        'token': 'invalidtoken',
        'password': 'anypassword'
    })

    assert response.status_code == 404
    assert response.get_json()['error'] == 'Invalid or expired token'
