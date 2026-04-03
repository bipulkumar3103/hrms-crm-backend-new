from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models.user import User
from app.models.role import Role
from app.models.company import Company
from flask_jwt_extended import create_access_token, decode_token

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/register', methods=['POST'])
def register():
    print("\n--- PRINT DEBUG: /register route hit ---")
    data = request.get_json()
    print(f"--- PRINT DEBUG: Registration data received: {data}")
    
    required_fields = ['company_name', 'company_domain', 'email', 'password']
    if not all(field in data for field in required_fields):
        print("--- PRINT DEBUG: Registration failed - missing fields.")
        return jsonify({'message': 'Missing required fields'}), 400

    if (Company.query.filter_by(domain=data['company_domain']).first() or
            User.query.filter_by(email=data['email']).first()):
        print("--- PRINT DEBUG: Registration failed - domain or email already exists.")
        return jsonify({'message': 'A company with this domain or email already exists.'}), 409

    print("--- PRINT DEBUG: Creating default roles if they don't exist...")
    for role_name in ['superadmin', 'admin', 'employee']:
        if not Role.query.filter_by(name=role_name).first():
            db.session.add(Role(name=role_name))
    db.session.commit()

    print("--- PRINT DEBUG: Creating new company...")
    new_company = Company(
        name=data['company_name'], 
        domain=data['company_domain'],
        profile_complete=False
    )
    db.session.add(new_company)
    db.session.commit()
    print(f"--- PRINT DEBUG: New company created with ID: {new_company.id}")

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    superadmin_role = Role.query.filter_by(name='superadmin').first()
    
    print("--- PRINT DEBUG: Creating new user...")
    new_user = User(
        first_name="Admin", 
        last_name="User",
        email=data['email'], 
        password_hash=hashed_password, 
        company_id=new_company.id,
        status='active'
    )
    new_user.roles.append(superadmin_role)
    db.session.add(new_user)
    db.session.commit()
    print(f"--- PRINT DEBUG: New user created with ID: {new_user.id}")

    user_roles = [role.name for role in new_user.roles]
    print("--- PRINT DEBUG: Creating JWT token for new user...")
    access_token = create_access_token(
        identity=str(new_user.id), 
        additional_claims={
            'roles': user_roles,
            'profile_complete': new_company.profile_complete
        }
    )
    
    print("--- PRINT DEBUG: Registration successful, returning token. ---")
    return jsonify(access_token=access_token), 201


@auth_blueprint.route('/login', methods=['POST'])
def login():
    print("\n--- PRINT DEBUG: Standard /login route hit ---")
    data = request.get_json()
    print(f"--- PRINT DEBUG: Login attempt for email: {data.get('email')} ---")
    user = User.query.filter_by(email=data['email'], status='active').first()

    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        print(f"--- PRINT DEBUG: User found and password correct for user ID: {user.id} ---")
        user_roles = [role.name for role in user.roles]
        profile_complete = user.company.profile_complete if user.company else False
        
        print("--- PRINT DEBUG: Creating JWT token...")
        access_token = create_access_token(
            identity=str(user.id), 
            additional_claims={
                'roles': user_roles,
                'profile_complete': profile_complete
            }
        )
        print("--- PRINT DEBUG: Login successful, returning token. ---")
        return jsonify(access_token=access_token), 200

    print("--- PRINT DEBUG: Login failed - Invalid credentials. ---")
    return jsonify({'message': 'Invalid credentials'}), 401


@auth_blueprint.route('/check-availability', methods=['POST'])
def check_availability():
    """Checks if a company domain or user email is already taken."""
    data = request.get_json()
    field = data.get('field')
    value = data.get('value')

    if not field or not value:
        return jsonify({'message': 'Field and value are required'}), 400

    available = False
    if field == 'domain':
        if not Company.query.filter_by(domain=value).first():
            available = True
    elif field == 'email':
        if not User.query.filter_by(email=value).first():
            available = True
    else:
        return jsonify({'message': 'Invalid field specified'}), 400

    return jsonify({'available': available}), 200


@auth_blueprint.route('/accept-invitation', methods=['POST'])
def accept_invitation():
    data = request.get_json()
    user = User.query.filter_by(invitation_token=data['token'], status='invited').first()

    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 404

    user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user.status = 'active'
    user.invitation_token = None
    db.session.commit()

    return jsonify({'message': 'Account activated successfully'}), 200

@auth_blueprint.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Email is required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if user:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from flask import current_app
        import datetime
        
        reset_token = create_access_token(identity=str(user.id), expires_delta=datetime.timedelta(hours=1))
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        sender = current_app.config.get('MAIL_DEFAULT_SENDER') or current_app.config.get('MAIL_USERNAME')
        if sender and current_app.config.get('MAIL_USERNAME') and current_app.config.get('MAIL_PASSWORD'):
            msg = MIMEMultipart('alternative')
            msg['From'] = sender
            msg['To'] = user.email
            msg['Subject'] = "NexusOS - Password Reset Request"
            
            # Plain text fallback
            body_plain = f"Hello,\n\nPlease click the following link to reset your password:\n{reset_url}\n\nIf you did not request a password reset, please ignore this email."
            msg.attach(MIMEText(body_plain, 'plain'))
            
            # Enterprise SaaS HTML Template
            primary_color = "#3730A3" # NexusOS theme primary
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 10px; background-color: #f3f4f6;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                      <tr>
                        <td style="padding: 32px; text-align: center; background-color: {primary_color};">
                          <h2 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">NexusOS</h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 36px 40px 48px;">
                          <h3 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600;">Reset your password</h3>
                          <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.6;">Hello,</p>
                          <p style="margin: 0 0 32px; color: #4b5563; font-size: 15px; line-height: 1.6;">We received a request to reset the password for your NexusOS account associated with this email address. Click the button below to securely set a new password. This link will expire in 1 hour.</p>
                          
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center">
                                <a href="{reset_url}" style="display: inline-block; padding: 14px 28px; background-color: {primary_color}; color: #ffffff; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 14px rgba(55, 48, 163, 0.35);">Reset Password</a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 36px 0 0; color: #6b7280; font-size: 13.5px; line-height: 1.5;">If you didn't request a password reset, you can safely ignore this email. Your account is secure and your password will not be changed.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 24px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0; color: #9ca3af; font-size: 12.5px;">&copy; 2026 NexusOS Enterprise. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """
            msg.attach(MIMEText(html_body, 'html'))
            
            try:
                server = smtplib.SMTP(current_app.config.get('MAIL_SERVER', 'smtp.gmail.com'), current_app.config.get('MAIL_PORT', 587))
                if current_app.config.get('MAIL_USE_TLS', True):
                    server.starttls()
                server.login(current_app.config.get('MAIL_USERNAME'), current_app.config.get('MAIL_PASSWORD'))
                server.send_message(msg)
                server.quit()
                print(f"--- PRINT DEBUG: Reset email sent to {email} ---")
            except Exception as e:
                print(f"--- PRINT DEBUG: Failed to send reset email: {e} ---")
        else:
            print("--- PRINT DEBUG: Mail credentials not fully configured in global settings. Sending skipped. ---")
            print(f"--- PRINT DEBUG: Link: {reset_url} ---")
            
    # Always return a success message so as not to leak emails
    return jsonify({'message': 'If your email is registered, you will receive a reset link shortly.'}), 200

@auth_blueprint.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('newPassword')
    
    if not token or not new_password:
        return jsonify({'message': 'Token and new password are required'}), 400
        
    try:
        # use decode_token instead of jwt_required as it's not in the header
        decoded_token = decode_token(token)
        user_id = decoded_token['sub']
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        
        return jsonify({'message': 'Password has been reset successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': 'Invalid or expired token'}), 400

