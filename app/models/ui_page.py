#!/usr/bin/env python

from app import db

class UIPage(db.Model):
    __tablename__ = 'ui_page'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    route = db.Column(db.String(255), nullable=False) # e.g., '/reports/financials'
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)

    # Relationship to the permissions
    permissions = db.relationship('PagePermission', back_populates='page', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<UIPage {self.name} ({self.route})>'

    def is_accessible_by(self, user):
        """Checks if a given user has permission to access this page."""
        if not user or self.company_id != user.company_id:
            return False

        # Superadmins have universal access within their scope (though this might need refinement)
        if user.has_role('superadmin'):
            return True

        # Get all role IDs for this page
        allowed_role_ids = {p.role_id for p in self.permissions}

        if not allowed_role_ids:
            # If a page has no specific permissions, deny access by default for security.
            # Alternatively, you could allow access to all authenticated users of the company.
            # Denying by default is the safer option.
            return False

        # Check if the user has any of the allowed roles
        user_role_ids = {role.id for role in user.roles}

        # The `isdisjoint` method returns True if the two sets have no common elements.
        # So, we return the opposite (not isdisjoint) to indicate if there is an overlap.
        return not allowed_role_ids.isdisjoint(user_role_ids)
