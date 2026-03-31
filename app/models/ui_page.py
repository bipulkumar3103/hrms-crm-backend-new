#!/usr/bin/env python

from app import db

class UIPage(db.Model):
    __tablename__ = 'ui_page'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    route = db.Column(db.String(255), nullable=False) # e.g., '/reports/financials'
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)

    # Relationship to the permissions (many-to-many with Role through PagePermission)
    roles = db.relationship('app.models.role.Role', secondary='page_permission', back_populates='pages', lazy='dynamic')

    def __repr__(self):
        return f'<UIPage {self.name} ({self.route})>'

    def is_accessible_by(self, user):
        """Checks if a given user has permission to access this page."""
        if not user or self.company_id != user.company_id:
            return False

        if user.has_role('superadmin'):
            return True

        allowed_roles = self.roles.all()
        if not allowed_roles:
            return False

        return any(user.has_role(role.name) for role in allowed_roles)
