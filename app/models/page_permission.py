#!/usr/bin/env python

from app import db

class PagePermission(db.Model):
    """
    Associates a UIPage with a Role, granting access.
    """
    __tablename__ = 'page_permission'
    page_id = db.Column(db.Integer, db.ForeignKey('pages.id'), primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), primary_key=True)

    # Relationships to get the actual objects
    page = db.relationship('UIPage', back_populates='permissions')
    role = db.relationship('Role', back_populates='page_permissions')
