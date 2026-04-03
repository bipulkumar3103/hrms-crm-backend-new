from app import db

class UIMetadata(db.Model):
    __tablename__ = 'ui_metadata'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True) # Null for global configs
    page_route = db.Column(db.String(255), nullable=False, default='/')
    is_global = db.Column(db.Boolean, default=False)
    ui_config = db.Column(db.JSON, nullable=False)

    company = db.relationship('Company', backref=db.backref('ui_layouts', lazy='dynamic'))

    def __repr__(self):
        return f'<UIMetadata Route:{self.page_route} Company:{self.company_id} Global:{self.is_global}>'
