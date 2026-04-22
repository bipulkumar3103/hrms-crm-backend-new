from app import db

class Company(db.Model):
    __tablename__ = 'company'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    domain = db.Column(db.String(128), unique=True, nullable=False)
    address = db.Column(db.String(255), nullable=True)
    logo_original_url = db.Column(db.String(255), nullable=True)
    logo_large_url = db.Column(db.String(255), nullable=True)
    logo_medium_url = db.Column(db.String(255), nullable=True)
    logo_small_url = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    website = db.Column(db.String(120), nullable=True)
    profile_complete = db.Column(db.Boolean, default=False, nullable=False)
    
    # Theme color fields (HEX codes) - Increased length for safety
    theme_primary_color = db.Column(db.String(10), default='#3730A3', nullable=False)
    theme_secondary_color = db.Column(db.String(10), default='#e0e7ff', nullable=False)
    theme_accent_color = db.Column(db.String(10), default='#1e293b', nullable=True)
    theme_bg_color = db.Column(db.String(10), default='#f0f4f8', nullable=True)
    theme_text_color = db.Column(db.String(10), default='#0f172a', nullable=True)

    # Mail Configuration Fields
    smtp_host = db.Column(db.String(255), nullable=True)
    smtp_port = db.Column(db.Integer, nullable=True)
    smtp_username = db.Column(db.String(255), nullable=True)
    smtp_password = db.Column(db.String(255), nullable=True)
    smtp_from_email = db.Column(db.String(255), nullable=True)

    # CMS Dashboard Config
    employee_dashboard_schema = db.Column(db.Text, nullable=True) 

    users = db.relationship('User', back_populates='company', lazy=True)