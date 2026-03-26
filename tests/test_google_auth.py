
import pytest
from unittest.mock import patch, MagicMock
from app import create_app, db, bcrypt
from app.models.user import User
from app.models.role import Role
from app.models.company import Company
from flask_jwt_extended import decode_token

@pytest.fixture(scope='module')
def test_client():
    app = create_app('testing')
    with app.test_client() as testing_client:
        with app.app_context():
            db.create_all()
            
            # Create roles if they don't exist
            for role_name in ['superadmin', 'admin', 'employee']:
                if not Role.query.filter_by(name=role_name).first():
                    db.session.add(Role(name=role_name))
            db.session.commit()

            yield testing_client
            db.drop_all()

@pytest.fixture(scope='function')
def init_database(test_client):
    # This fixture ensures a clean slate for each test function
    with test_client.application.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()

        # Re-create roles
        for role_name in ['superadmin', 'admin', 'employee']:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(Role(name=role_name))
        db.session.commit()
    yield
    with test_client.application.app_context():
        db.session.remove()
        db.drop_all()


def test_google_login_superadmin(test_client, init_database):
    """
    Test Google login flow for a new user who becomes a superadmin
    (first user from a new company domain).
    """
    with patch('app.auth.google.oauth.google') as mock_google_oauth:
        # Mock the Google OAuth responses
        mock_google_oauth.authorize_access_token.return_value = {
            'access_token': 'mock_google_access_token',
            'id_token': 'mock_id_token_jwt'
        }
        mock_google_oauth.parse_id_token.return_value = {
            'email': 'superadmin@newcompany.com',
            'sub': 'mock_google_id_superadmin',
            'given_name': 'Super',
            'family_name': 'Admin'
        }

        # Simulate the callback from Google
        response = test_client.get('/authorize/google', follow_redirects=False)

        assert response.status_code == 302  # Expect a redirect
        assert 'token=' in response.headers['Location']

        # Extract the token from the redirect URL
        redirect_url = response.headers['Location']
        token = redirect_url.split('token=')[1]

        # Decode and verify the token
        decoded_token = decode_token(token)
        
        with test_client.application.app_context():
            user = User.query.filter_by(email='superadmin@newcompany.com').first()
            assert user is not None
            assert 'superadmin' in [role.name for role in user.roles]
            assert user.company is not None
            assert user.company.domain == 'newcompany.com'

            assert decoded_token['identity'] == str(user.id)
            assert 'superadmin' in decoded_token['roles']
            assert decoded_token['profile_complete'] is False

            # Verify the company was created
            company = Company.query.filter_by(domain='newcompany.com').first()
            assert company is not None
            assert company.profile_complete is False
