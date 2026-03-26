from app import db

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)

    # The relationship to the User model
    user = db.relationship('User', backref=db.backref('employee_record', uselist=False))

    def __repr__(self):
        return f'<Employee {self.id}>'
