
import os
from flask import Blueprint, redirect, url_for, session, current_app, request
from authlib.integrations.flask_client import OAuth
from authlib.common.security import generate_token
from flask_jwt_extended import create_access_token
from app.models.user import User
from app.models.company import Company
from app.models.role import Role
from app import db

google_blueprint = Blueprint('google', __name__)

oauth = OAuth()

def init_app(app):
    """Initialize the Google OAuth client."""
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id=app.config.get('GOOGLE_CLIENT_ID'),
        client_secret=app.config.get('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

@google_blueprint.route('/login/google')
def login():
    """Redirect to Google to log in."""
    redirect_uri = url_for('google.authorize', _external=True, _scheme='https')
    current_app.logger.info(f"!!!! IMPORTANT !!!! Generated Redirect URI for Google: {redirect_uri}")
    
    nonce = generate_token()
    session['nonce'] = nonce
    
    return oauth.google.authorize_redirect(redirect_uri, nonce=nonce)

@google_blueprint.route('/authorize/google')
def authorize():
    current_app.logger.info(f"DEBUG: OAuth callback received. URL: {request.url}")
    try:
        token = oauth.google.authorize_access_token()
        nonce = session.pop('nonce', None)
        user_info = oauth.google.parse_id_token(token, nonce=nonce)
    except Exception as e:
        current_app.logger.error(f"Error during Google OAuth callback: {e}", exc_info=True)
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}?error=oauth_error")

    current_app.logger.info(f"DEBUG: Google user info: {user_info}")
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    user_email = user_info['email'].lower()
    
    user = User.query.filter_by(email=user_email).first()
    
    access_token = None

    if user:
        # Existing user logs in.
        current_app.logger.info(f"Existing user signing in: {user.email}")
        if not user.google_id:
            user.google_id = user_info['sub']
        
        if user.status == 'invited':
            user.is_active = True
            user.status = 'active'
        
        db.session.commit()
        
        user_roles = [role.name for role in user.roles]
        profile_complete = user.company.profile_complete if user.company else False
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'roles': user_roles,
                'profile_complete': profile_complete
            }
        )

    else:
        # This is a new user.
        user_domain = user_email.split('@')[1]
        company = Company.query.filter_by(domain=user_domain).first()
        
        if company:
            # New user joining an EXISTING company. They are inactive until approved.
            current_app.logger.info(f"New user {user_email} joining existing company {company.name}.")
            new_user = User(
                email=user_email,
                google_id=user_info['sub'],
                first_name=user_info.get('given_name'),
                last_name=user_info.get('family_name'),
                is_active=False, 
                company_id=company.id,
                status='pending_approval'
            )
            db.session.add(new_user)
            db.session.commit()
            
            # Token for pending user - UI should handle this state.
            access_token = create_access_token(
                identity=str(new_user.id),
                additional_claims={
                    'roles': [],
                    'profile_complete': company.profile_complete,
                    'status': 'pending_approval'
                }
            )
        else:
            # New user, new company. Create the company and make the user superadmin.
            current_app.logger.info(f"Creating new company for domain {user_domain} by user {user_email}.")
            
            new_company = Company(
                name=user_domain.split('.')[0].capitalize(),
                domain=user_domain,
                profile_complete=False
            )
            db.session.add(new_company)
            db.session.flush()

            new_user = User(
                email=user_email,
                google_id=user_info['sub'],
                first_name=user_info.get('given_name'),
                last_name=user_info.get('family_name'),
                is_active=True,
                status='active',
                company_id=new_company.id
            )
            
            superadmin_role = Role.query.filter_by(name='superadmin').first()
            if not superadmin_role:
                superadmin_role = Role(name='superadmin')
                db.session.add(superadmin_role)
            
            new_user.roles.append(superadmin_role)
            db.session.add(new_user)
            
            db.session.commit()

            # Token for new superadmin, profile is not complete.
            access_token = create_access_token(
                identity=str(new_user.id),
                additional_claims={
                    'roles': ['superadmin'],
                    'profile_complete': False
                }
            )

    if access_token:
        frontend_url += f"?token={access_token}"

    current_app.logger.info(f"DEBUG: Redirecting to frontend: {frontend_url}")
    return redirect(frontend_url)
