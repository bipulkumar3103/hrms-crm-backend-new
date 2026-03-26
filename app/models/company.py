from app import db

class Company(db.Model):
    __tablename__ = 'companies'
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
    theme_primary_color = db.Column(db.String(10), default='#000000', nullable=False)
    theme_secondary_color = db.Column(db.String(10), default='#ffffff', nullable=False)
    theme_accent_color = db.Column(db.String(10), nullable=True)
    theme_bg_color = db.Column(db.String(10), nullable=True)
    theme_text_color = db.Column(db.String(10), nullable=True)

    users = db.relationship('User', back_populates='company', lazy=True)