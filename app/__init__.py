
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import config
import logging
from logging.handlers import RotatingFileHandler
import os
from werkzeug.middleware.proxy_fix import ProxyFix

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    # Broaden CORS for all API v1 routes with explicit credentials support
    CORS(app, resources={r"/api/v1/.*": {"origins": "*"}}, supports_credentials=True, 
         allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"])

    # Apply the ProxyFix middleware to handle X-Forwarded- headers
    app.wsgi_app = ProxyFix(
        app.wsgi_app, x_for=1, x_proto=1, x_host=1
    )

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    # Import and initialize google auth
    from app.auth import google
    google.init_app(app)

    # Configure logging
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/hrms_crm.log', maxBytes=10*1024*1024,
                                           backupCount=10, delay=True)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

        app.logger.setLevel(logging.INFO)
        app.logger.info('HRMS-CRM startup')

    @app.before_request
    def log_request_info():
        # Specifically check for Authorization to debug 401s
        auth_header = request.headers.get('Authorization')
        auth_status = f"PRESENT (Starts with: {auth_header[:15]}...)" if auth_header else "MISSING"
        
        app.logger.info(f'--- Incoming Request: {request.method} {request.path} ---')
        app.logger.info(f'Auth Header: {auth_status}')
        app.logger.info(f'Origin: {request.headers.get("Origin")}')
        
        # Log all headers for full context if needed
        # app.logger.info(f'Full Headers: {request.headers}')
        
        if request.is_json:
            try:
                app.logger.info(f'Body: {request.get_json()}')
            except:
                pass

    # Import models to ensure they are registered with SQLAlchemy metadata
    from app.models.user import User
    from app.models.role import Role
    from app.models.company import Company
    from app.models.employee import Employee
    from app.models.ui_page import UIPage
    from app.models.page_permission import PagePermission
    from app.models.form_submission import FormSubmission
    from app.models.timesheet import Project, ProjectAssignment, Timesheet, TimesheetDay, TimePunch


    from app.api.auth import auth_blueprint
    from app.api.onboarding import onboarding_blueprint
    from app.routes.uploads import uploads_bp
    from app.api.company import company_blueprint
    from app.auth.google import google_blueprint
    from app.api.employees import employees_blueprint
    from app.api.users import users_blueprint
    from app.api.ui import ui_blueprint
    from app.api.forms import forms_blueprint
    from app.api.timesheets import timesheets_blueprint


    @jwt.user_lookup_loader
    def user_lookup_loader(_jwt_header, jwt_data):
        try:
            identity = jwt_data["sub"]
            return User.query.get(int(identity))
        except (ValueError, TypeError):
            return None
    
    app.register_blueprint(auth_blueprint, url_prefix='/api/v1/auth')
    app.register_blueprint(onboarding_blueprint, url_prefix='/api/v1/onboarding')
    app.register_blueprint(uploads_bp, url_prefix='/api/v1/uploads')
    app.register_blueprint(company_blueprint, url_prefix='/api/v1/company')
    app.register_blueprint(google_blueprint, url_prefix='/api/v1/auth')
    app.register_blueprint(employees_blueprint, url_prefix='/api/v1/employees')
    app.register_blueprint(users_blueprint, url_prefix='/api/v1/users')
    app.register_blueprint(ui_blueprint, url_prefix='/api/v1/ui')
    app.register_blueprint(timesheets_blueprint, url_prefix='/api/v1/timesheets')
    
    # Universal Catch-All for Dynamic Forms (Must be Registered LAST)
    # This captures any POST /api/v1/<path> that wasn't claimed above.
    app.register_blueprint(forms_blueprint, url_prefix='/api/v1')

    with app.app_context():
        db.create_all()

    @app.route("/")
    def hello_world():
        return "<h1>Flask Server is Running</h1><p>The API is alive.</p>"

    return app
