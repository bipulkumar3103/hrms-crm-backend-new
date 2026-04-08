
import secrets
from app import db

# Define the user_roles association table
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(64), nullable=True)
    last_name = db.Column(db.String(64), nullable=True)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)
    google_id = db.Column(db.String(128), unique=True, nullable=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True)
    invitation_token = db.Column(db.String(64), unique=True, nullable=True)
    status = db.Column(db.String(20), default='invited', nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    phone_number = db.Column(db.String(20), nullable=True)
    job_title = db.Column(db.String(128), nullable=True)
    department = db.Column(db.String(128), nullable=True)
    location = db.Column(db.String(128), nullable=True)
    
    avatar_original_url = db.Column(db.String(255), nullable=True)
    avatar_medium_url = db.Column(db.String(255), nullable=True)
    avatar_small_url = db.Column(db.String(255), nullable=True)
    
    dob = db.Column(db.String(20), nullable=True)
    address_temporary = db.Column(db.Text, nullable=True)
    address_permanent = db.Column(db.Text, nullable=True)
    
    pan_number = db.Column(db.String(15), nullable=True)
    aadhar_number = db.Column(db.String(20), nullable=True)
    uan = db.Column(db.String(20), nullable=True)

    roles = db.relationship('Role', secondary=user_roles, lazy='subquery',
                            back_populates='users')
    company = db.relationship('Company', back_populates='users')

    def __repr__(self):
        return f'<User {self.email}>'

    def generate_invitation_token(self):
        self.invitation_token = secrets.token_hex(32)

    def has_role(self, role_name):
        return any(role.name == role_name for role in self.roles)

    @property
    def is_admin_or_super(self):
        """Returns True if the user has either the 'admin' or 'superadmin' role."""
        return any(role.name in ['admin', 'superadmin'] for role in self.roles)

    # Hierarchy support for Enterprise Approvals
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    manager = db.relationship('User', remote_side=[id], backref=db.backref('reports', lazy='dynamic'))
