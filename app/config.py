
# import os
# from dotenv import load_dotenv

# load_dotenv()

# basedir = os.path.abspath(os.path.dirname(__file__))
# project_root = os.path.abspath(os.path.join(basedir, os.pardir))

# class Config:
#     """Base configuration settings."""
#     SECRET_KEY = os.getenv('SECRET_KEY')
#     JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
#     SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL') or 'sqlite:///' + os.path.join(project_root, 'instance', 'app.db')
#     SQLALCHEMY_TRACK_MODIFICATIONS = False

#     # Google OAuth credentials
#     GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
#     GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

# class TestingConfig(Config):
#     """Configuration for testing, uses an in-memory database."""
#     TESTING = True
#     SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# # This dictionary is essential for the create_app factory to work.
# config = {
#     'default': Config,
#     'testing': TestingConfig
# }

import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))
project_root = os.path.abspath(os.path.join(basedir, os.pardir))


class Config:
    """Base configuration settings."""

    # 🔐 Security
    SECRET_KEY = os.getenv('SECRET_KEY', '094d80dd399f08ef8a4e2ffb32934394a9e2150bd3b9e98e72d8149afc1fc687')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'f0838c8782257093d1662aa14fe6b603a7142a5c4756440f6719e164d2f6e0ee')

    # 🗄️ Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL') or \
        'sqlite:///' + os.path.join(project_root, 'instance', 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 🔑 Google OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

    # 🌐 URL / Server Config (ADDED — critical for OAuth)
    SERVER_NAME = os.getenv('SERVER_NAME', 'localhost:5000')
    PREFERRED_URL_SCHEME = os.getenv('PREFERRED_URL_SCHEME', 'http')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

    # 🍪 Session (ADDED — required for OAuth stability)
    SESSION_COOKIE_SECURE = False  # True only in HTTPS
    SESSION_COOKIE_SAMESITE = "Lax"

    # ☁️ AWS (optional, safe)
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET')
    AWS_REGION = os.getenv('AWS_REGION', 'ap-south-1')

    # 📧 Mail (optional)
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')


class TestingConfig(Config):
    """Configuration for testing, uses an in-memory database."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Keep your original structure intact
config = {
    'default': Config,
    'testing': TestingConfig
}