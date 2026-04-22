from app import db
from datetime import datetime

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True) # Nullable for global defaults
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_global = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    designations = db.relationship('Designation', backref='department', lazy='dynamic', cascade="all, delete-orphan")
    users = db.relationship('User', backref='dept_relationship', lazy='dynamic')

    def __repr__(self):
        return f'<Department {self.name}>'

class Designation(db.Model):
    __tablename__ = 'designations'
    id = db.Column(db.Integer, primary_key=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    users = db.relationship('User', backref='designation_relationship', lazy='dynamic')

    def __repr__(self):
        return f'<Designation {self.name}>'
