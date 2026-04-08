from app import db
from datetime import datetime

class Project(db.Model):
    __tablename__ = 'nx_projects'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    code = db.Column(db.String(32), unique=True, nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assignments = db.relationship('ProjectAssignment', backref='project', lazy='dynamic')
    timesheets = db.relationship('Timesheet', backref='project', lazy='dynamic')

class ProjectAssignment(db.Model):
    __tablename__ = 'nx_project_assignments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('nx_projects.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('project_assignments', lazy='dynamic'))

class Timesheet(db.Model):
    __tablename__ = 'nx_timesheets'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('nx_projects.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='DRAFT') # DRAFT, PENDING, APPROVED, REJECTED
    total_hours = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    # Re-approval & Visibility
    is_readonly = db.Column(db.Boolean, default=False)
    
    user = db.relationship('User', backref=db.backref('timesheets', lazy='dynamic'))
    days = db.relationship('TimesheetDay', backref='timesheet', lazy='dynamic', cascade="all, delete-orphan")

class TimesheetDay(db.Model):
    __tablename__ = 'nx_timesheet_days'
    id = db.Column(db.Integer, primary_key=True)
    timesheet_id = db.Column(db.Integer, db.ForeignKey('nx_timesheets.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    hours = db.Column(db.Float, default=0.0)
    ot_hours = db.Column(db.Float, default=0.0)
    notes = db.Column(db.Text, nullable=True)

    punches = db.relationship('TimePunch', backref='day', lazy='dynamic', cascade="all, delete-orphan")

class TimePunch(db.Model):
    __tablename__ = 'nx_time_punches'
    id = db.Column(db.Integer, primary_key=True)
    day_id = db.Column(db.Integer, db.ForeignKey('nx_timesheet_days.id'), nullable=False)
    punch_in = db.Column(db.DateTime, nullable=False)
    punch_out = db.Column(db.DateTime, nullable=True)
    type = db.Column(db.String(20), default='REGULAR') # REGULAR, BREAK
    location = db.Column(db.String(128), nullable=True)

class ApprovalLog(db.Model):
    __tablename__ = 'nx_approval_logs'
    id = db.Column(db.Integer, primary_key=True)
    timesheet_id = db.Column(db.Integer, db.ForeignKey('nx_timesheets.id'), nullable=False)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(20)) # APPROVED, REJECTED, UNLOCKED
    comments = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    approver = db.relationship('User')
    timesheet = db.relationship('Timesheet', backref=db.backref('approval_logs', lazy='dynamic'))
