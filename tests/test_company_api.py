import pytest
from app import create_app, db
from app.models.user import User
from app.models.company import Company
from flask_jwt_extended import create_access_token

@pytest.fixture(scope='module')
def setup_test_env():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "e2157a9423b04a39b25212ab56a42767"
    })

    with app.test_client() as testing_client:
        with app.app_context():
            db.create_all()
            
            # Setup test data
            company = Company(name="Test Corp", domain="test.com")
            db.session.add(company)
            db.session.commit()

            user = User(email="test@test.com", company_id=company.id)
            user.password_hash = "somehash"
            db.session.add(user)
            db.session.commit()

            user_no_company = User(email="no-company@test.com")
            db.session.add(user_no_company)
            db.session.commit()

            # Refresh objects to ensure they are bound to the session if needed
            db.session.refresh(user)
            db.session.refresh(company)
            db.session.refresh(user_no_company)

            yield testing_client, user, company, user_no_company

            db.session.remove()
            db.drop_all()

def test_get_my_company_success(setup_test_env):
    """Test successful retrieval of company data."""
    test_client, user, company, _ = setup_test_env
    
    with test_client.application.app_context():
        # Use the user's ID as the identity for the JWT.
        access_token = create_access_token(identity=str(user.id))
    
    response = test_client.get('/api/v1/company/me', headers={
        "Authorization": f"Bearer {access_token}"
    })
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['name'] == company.name
    assert json_data['domain'] == company.domain

def test_get_my_company_unauthorized(setup_test_env):
    """Test unauthorized access without a JWT token."""
    test_client, _, _, _ = setup_test_env
    response = test_client.get('/api/v1/company/me')
    assert response.status_code == 401

def test_get_my_company_no_company(setup_test_env):
    """Test that a user with no company receives a 404."""
    test_client, _, _, user_no_company = setup_test_env
    
    with test_client.application.app_context():
        # Use the user's ID as the identity for the JWT.
        access_token = create_access_token(identity=str(user_no_company.id))
    
    response = test_client.get('/api/v1/company/me', headers={
        "Authorization": f"Bearer {access_token}"
    })
    
    assert response.status_code == 404
    json_data = response.get_json()
    assert json_data['message'] == "User is not associated with any company."