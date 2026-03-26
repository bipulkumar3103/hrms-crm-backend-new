from app import db
from app.models.user import user_roles

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

    # Establish the many-to-many relationship to users
    users = db.relationship('User', secondary=user_roles, lazy='subquery',
                            back_populates='roles')

    # Relationship to the PagePermission model
    page_permissions = db.relationship('PagePermission', back_populates='role', lazy='dynamic')

    def __repr__(self):
        return f'<Role {self.name}>'
