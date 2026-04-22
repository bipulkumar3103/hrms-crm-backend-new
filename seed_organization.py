from app import create_app, db
from app.models.organization import Department, Designation

def seed_organization():
    app = create_app()
    with app.app_context():
        print("Seeding Global Departments and Designations...")
        
        # 1. HR Department
        hr = Department.query.filter_by(name='HR', is_global=True).first()
        if not hr:
            hr = Department(name='HR', description='Human Resources & Governance', is_global=True)
            db.session.add(hr)
            db.session.flush() # Get ID
            print("Added HR Department")
        
        # 2. Designations for HR
        hr_desigs = ['hradmin', 'hrexecutive', 'hr_manager']
        for d_name in hr_desigs:
            if not Designation.query.filter_by(name=d_name, department_id=hr.id).first():
                desig = Designation(name=d_name, department_id=hr.id, is_default=True)
                db.session.add(desig)
                print(f"Added Designation: {d_name} to HR")

        # 3. Engineering Department
        eng = Department.query.filter_by(name='Engineering', is_global=True).first()
        if not eng:
            eng = Department(name='Engineering', description='Software & Systems Engineering', is_global=True)
            db.session.add(eng)
            db.session.flush()
            print("Added Engineering Department")

        # 4. Designations for Engineering
        eng_desigs = ['Senior Engineer', 'Junior Engineer', 'Lead Developer', 'CTO']
        for d_name in eng_desigs:
            if not Designation.query.filter_by(name=d_name, department_id=eng.id).first():
                desig = Designation(name=d_name, department_id=eng.id, is_default=True)
                db.session.add(desig)
                print(f"Added Designation: {d_name} to Engineering")

        # 5. Admin/General Department
        admin = Department.query.filter_by(name='Administration', is_global=True).first()
        if not admin:
            admin = Department(name='Administration', description='Corporate Administration', is_global=True)
            db.session.add(admin)
            db.session.flush()
            print("Added Administration Department")

        admin_desigs = ['Superadmin', 'Admin', 'Operations Head']
        for d_name in admin_desigs:
            if not Designation.query.filter_by(name=d_name, department_id=admin.id).first():
                desig = Designation(name=d_name, department_id=admin.id, is_default=True)
                db.session.add(desig)
                print(f"Added Designation: {d_name} to Administration")

        db.session.commit()
        print("Optimization: Seeding Complete.")

if __name__ == "__main__":
    seed_organization()
