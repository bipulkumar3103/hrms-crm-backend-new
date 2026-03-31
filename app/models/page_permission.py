#!/usr/bin/env python

from app import db

class PagePermission(db.Model):
    """
    Associates a UIPage with a Role, granting access.
    """
    __tablename__ = 'page_permission'
    page_id = db.Column(db.Integer, db.ForeignKey('ui_page.id'), primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), primary_key=True)
