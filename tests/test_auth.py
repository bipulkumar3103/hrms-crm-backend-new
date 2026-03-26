import json

def test_successful_register(test_client):
    """
    GIVEN a test client
    WHEN a POST request is made to /api/v1/auth/register
    THEN the response should be 201 and contain a success message
    """
    response = test_client.post('/api/v1/auth/register', json={
        'company_name': 'Test Company',
        'company_domain': 'test.com',
        'email': 'test@test.com',
        'password': 'password',
        'theme_primary_color': '#000000',
        'theme_secondary_color': '#ffffff'
    })
    assert response.status_code == 201
    assert response.get_json()['message'] == 'Company and superadmin registered successfully'

def test_employee_login_success(test_client):
    """
    GIVEN an activated employee
    WHEN a POST request is made to /api/v1/auth/employee-login
    THEN the response should be 200 and contain an access token
    """
    # Set up the company and invite the employee
    test_client.post('/api/v1/auth/register', json={
        'company_name': 'Employee Login Co',
        'company_domain': 'emplogin.com',
        'email': 'admin@emplogin.com',
        'password': 'password',
        'theme_primary_color': '#000000',
        'theme_secondary_color': '#ffffff'
    })
    login_res = test_client.post('/api/v1/auth/login', json={
        'email': 'admin@emplogin.com',
        'password': 'password'
    })
    headers = {'Authorization': f'Bearer {login_res.get_json()["access_token"]}'}
    invite_res = test_client.post('/api/v1/users/invite', headers=headers, json={
        'first_name': 'Login',
        'last_name': 'Employee',
        'email': 'login@emplogin.com',
        'role': 'employee'
    })
    from app.models.user import User
    token = User.query.filter_by(email='login@emplogin.com').first().invitation_token

    # Activate the employee's account
    test_client.post('/api/v1/auth/accept-invitation', json={
        'token': token,
        'password': 'securepassword'
    })

    # Attempt to log in as the employee
    response = test_client.post('/api/v1/auth/login', json={
        'email': 'login@emplogin.com',
        'password': 'securepassword'
    })

    assert response.status_code == 200
    assert 'access_token' in response.get_json()
