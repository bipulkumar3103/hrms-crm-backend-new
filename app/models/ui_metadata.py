from app import db

class UIMetadata(db.Model):
    __tablename__ = 'ui_metadata'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False, unique=True)
    ui_config = db.Column(db.JSON, nullable=False)

    company = db.relationship('Company', backref=db.backref('ui_metadata', uselist=False))

    def __repr__(self):
        return f'<UIMetadata for Company {self.company_id}>'
