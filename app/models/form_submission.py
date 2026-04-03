from datetime import datetime
from app import db

class FormSubmission(db.Model):
    """
    Stores any dynamic form submission made by an employee.
    The form_name and source_route identify which CMS form triggered the submission.
    """
    __tablename__ = 'form_submissions'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True)
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    form_name = db.Column(db.String(255), nullable=True)   # e.g. "Leave Request"
    source_route = db.Column(db.String(255), nullable=True) # e.g. "/employee/dashboard"
    form_slug = db.Column(db.String(255), nullable=True)    # e.g. "test" or "vacation-request"
    data = db.Column(db.JSON, nullable=False)               # The actual submitted field data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    company = db.relationship('Company', backref=db.backref('form_submissions', lazy='dynamic'))
    submitter = db.relationship('User', backref='form_submissions', foreign_keys=[submitted_by])

    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'submitted_by': self.submitted_by,
            'submitter_name': f"{self.submitter.first_name or ''} {self.submitter.last_name or ''}".strip() if self.submitter else 'Unknown',
            'form_name': self.form_name,
            'source_route': self.source_route,
            'form_slug': self.form_slug,
            'data': self.data,
            'created_at': self.created_at.isoformat(),
        }

    def __repr__(self):
        return f'<FormSubmission form:{self.form_name} by user:{self.submitted_by}>'
