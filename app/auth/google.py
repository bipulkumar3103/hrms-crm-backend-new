
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
    print("\n--- PRINT DEBUG: Initializing Google OAuth ---")
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
    print("--- PRINT DEBUG: Google OAuth Initialized ---\n")

@google_blueprint.route('/login/google')
def login():
    print("\n--- PRINT DEBUG: [1/8] /login/google route hit ---")
    redirect_uri = url_for('google.authorize', _external=True, _scheme='https')
    print(f"--- PRINT DEBUG: [2/8] Generated Redirect URI for Google: {redirect_uri} ---")
    current_app.logger.info(f"!!!! IMPORTANT !!!! Generated Redirect URI for Google: {redirect_uri}")
    print(f"TERMINAL LOG: Generated Redirect URI for Google: {redirect_uri}")
    
    nonce = generate_token()
    session['nonce'] = nonce
    print(f"--- PRINT DEBUG: [3/8] Nonce generated and stored in session: {nonce} ---")
    
    print("--- PRINT DEBUG: [4/8] Redirecting to Google for authorization... ---")
    return oauth.google.authorize_redirect(redirect_uri, nonce=nonce)

@google_blueprint.route('/authorize/google')
def authorize():
    print("\n--- PRINT DEBUG: [5/8] /authorize/google callback hit ---")
    print(f"--- PRINT DEBUG: Full callback URL from Google: {request.url} ---")
    current_app.logger.info(f"DEBUG: OAuth callback received. URL: {request.url}")
    print(f"TERMINAL LOG: OAuth callback received. URL: {request.url}")
    try:
        print("--- PRINT DEBUG: Attempting to fetch access token from Google... ---")
        token = oauth.google.authorize_access_token()
        print("--- PRINT DEBUG: Access token fetched successfully. ---")
        nonce = session.pop('nonce', None)
        print(f"--- PRINT DEBUG: Popped nonce from session: {nonce} ---")
        print("--- PRINT DEBUG: Parsing ID token from Google... ---")
        user_info = oauth.google.parse_id_token(token, nonce=nonce)
    except Exception as e:
        print(f"--- PRINT DEBUG: ERROR during Google OAuth callback: {e} ---")
        current_app.logger.error(f"Error during Google OAuth callback: {e}", exc_info=True)
        print(f"TERMINAL LOG: Error during Google OAuth callback: {e}")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}?error=oauth_error")

    print("--- PRINT DEBUG: [6/8] ID token parsed. User Info Received: ---")
    print(user_info)
    current_app.logger.info(f"DEBUG: Google user info: {user_info}")
    print(f"TERMINAL LOG: Google user info: {user_info}")
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    user_email = user_info['email'].lower()
    print(f"--- PRINT DEBUG: User email from token: {user_email} ---")
    
    print("--- PRINT DEBUG: [7/8] Checking if user exists in the database... ---")
    user = User.query.filter_by(email=user_email).first()
    
    access_token = None

    if user:
        print("--- PRINT DEBUG: User FOUND in database. Entering EXISTING user logic. ---")
        current_app.logger.info(f"Existing user signing in: {user.email}")
        if not user.google_id:
            print("--- PRINT DEBUG: User has no google_id, setting it now. ---")
            user.google_id = user_info['sub']
        
        if user.status == 'invited':
            print("--- PRINT DEBUG: User status is 'invited', changing to 'active'. ---")
            user.is_active = True
            user.status = 'active'
        
        print("--- PRINT DEBUG: Committing user updates to database. ---")
        db.session.commit()
        
        user_roles = [role.name for role in user.roles]
        print(f"--- PRINT DEBUG: User roles: {user_roles} ---")
        profile_complete = user.company.profile_complete if user.company else False
        print(f"--- PRINT DEBUG: Profile complete status: {profile_complete} ---")
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'roles': user_roles,
                'profile_complete': profile_complete
            }
        )
        print("--- PRINT DEBUG: JWT access token created for existing user. ---")

    else:
        print("--- PRINT DEBUG: User NOT FOUND in database. Entering NEW user logic. ---")
        user_domain = user_email.split('@')[1]
        print(f"--- PRINT DEBUG: New user domain: {user_domain} ---")
        company = Company.query.filter_by(domain=user_domain).first()
        
        if company:
            print(f"--- PRINT DEBUG: Domain matches existing company: {company.name}. Creating 'pending_approval' user. ---")
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
            print(f"--- PRINT DEBUG: New 'pending_approval' user created with ID: {new_user.id} ---")
            
            access_token = create_access_token(
                identity=str(new_user.id),
                additional_claims={
                    'roles': [],
                    'profile_complete': company.profile_complete,
                    'status': 'pending_approval'
                }
            )
            print("--- PRINT DEBUG: JWT created for pending user. ---")
        else:
            print(f"--- PRINT DEBUG: No company found for domain {user_domain}. Creating new company and superadmin. ---")
            current_app.logger.info(f"Creating new company for domain {user_domain} by user {user_email}.")
            
            new_company = Company(
                name=user_domain.split('.')[0].capitalize(),
                domain=user_domain,
                profile_complete=False
            )
            db.session.add(new_company)
            db.session.flush()
            print(f"--- PRINT DEBUG: New company created with ID: {new_company.id} ---")

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
                print("--- PRINT DEBUG: 'superadmin' role not found, creating it. ---")
                superadmin_role = Role(name='superadmin')
                db.session.add(superadmin_role)
            
            new_user.roles.append(superadmin_role)
            db.session.add(new_user)
            
            db.session.commit()
            print(f"--- PRINT DEBUG: New user created with ID: {new_user.id} and assigned 'superadmin' role. ---")

            access_token = create_access_token(
                identity=str(new_user.id),
                additional_claims={
                    'roles': ['superadmin'],
                    'profile_complete': False
                }
            )
            print("--- PRINT DEBUG: JWT created for new superadmin. ---")

    if access_token:
        frontend_url += f"?token={access_token}"

    print(f"--- PRINT DEBUG: [8/8] Final redirect URL to frontend: {frontend_url} ---")
    current_app.logger.info(f"DEBUG: Redirecting to frontend: {frontend_url}")
    print(f"TERMINAL LOG: Redirecting to frontend: {frontend_url}")
    return redirect(frontend_url)
