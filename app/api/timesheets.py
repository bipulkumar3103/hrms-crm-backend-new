from flask import Blueprint, request, jsonify
from sqlalchemy import extract, func
from app import db
from app.models.user import User
from app.models.timesheet import Project, ProjectAssignment, Timesheet, TimesheetDay, TimePunch, ApprovalLog
from app.utils.decorators import require_role
from flask_jwt_extended import jwt_required, get_jwt_identity, current_user
from datetime import datetime, timedelta, date
import json
from dateutil import parser

timesheets_blueprint = Blueprint('timesheets', __name__)

def parse_date_flexible(val):
    """
    Robust Date Parser for Enterprise Data.
    Handles:
    1. Standard ISO Strings (YYYY-MM-DD)
    2. Regional Strings (MM/DD/YYYY, DD-MM-YYYY, etc.)
    3. Excel Serial Numbers (Numbers like 45230)
    """
    if not val:
        return None
        
    # Scenario A: Excel Serial Number (Integer or Float)
    if isinstance(val, (int, float)) or (isinstance(val, str) and val.replace('.','',1).isdigit()):
        try:
            days = float(val)
            # Excel's base date is Dec 30, 1899
            return date(1899, 12, 30) + timedelta(days=days)
        except:
            pass
            
    # Scenario B: String Parsing (Fuzzy Detection)
    if isinstance(val, str):
        try:
            return parser.parse(val).date()
        except (ValueError, OverflowError):
            return None
            
    # Scenario C: Already a date/datetime object
    if isinstance(val, (date, datetime)):
        return val.date() if isinstance(val, datetime) else val
        
    return None

@timesheets_blueprint.route('/my-projects', methods=['GET'])
@jwt_required()
def get_my_projects():
    user_id = get_jwt_identity()
    assignments = ProjectAssignment.query.filter_by(user_id=user_id).all()
    projects = [
        {
            "id": a.project.id,
            "name": a.project.name,
            "code": a.project.code,
            "description": a.project.description,
            "is_active": a.project.is_active
        } for a in assignments
    ]
    return jsonify(projects), 200

@timesheets_blueprint.route('/projects', methods=['GET'])
@jwt_required()
def list_projects():
    # Admin and HR can see all projects
    if not (current_user.is_admin_or_super or current_user.is_hr):
        return jsonify({"message": "Unauthorized"}), 403
    
    projects = Project.query.filter_by(company_id=current_user.company_id).all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "code": p.code,
        "description": p.description,
        "is_active": p.is_active
    } for p in projects]), 200

@timesheets_blueprint.route('/projects', methods=['POST'])
@jwt_required()
@require_role('admin', 'superadmin')
def create_project():
    print("DEBUG: [create_project] Endpoint reached")
    try:
        data = request.get_json()
        name = data.get('name')
        code = data.get('code')
        
        print(f"DEBUG: [create_project] Received: name={name}, code={code}")
        
        if not name or not code:
            return jsonify({"message": "Name and Code are required"}), 400
            
        # Check if project code already exists
        existing = Project.query.filter_by(code=code).first()
        if existing:
            print(f"DEBUG: [create_project] Conflict: Code {code} already exists")
            return jsonify({"message": f"Project code '{code}' is already in use"}), 409
            
        project = Project(
            name=name,
            code=code,
            description=data.get('description', ''),
            company_id=current_user.company_id
        )
        db.session.add(project)
        db.session.commit()
        print(f"DEBUG: [create_project] Success: Created ID {project.id}")
        return jsonify({"message": "Project created", "id": project.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"DEBUG: [create_project] FATAL ERROR: {str(e)}")
        return jsonify({"message": f"Server Error: {str(e)}"}), 500

@timesheets_blueprint.route('/projects/<int:project_id>/toggle', methods=['POST'])
@jwt_required()
@require_role('admin', 'superadmin')
def toggle_project_status(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"message": "Project not found"}), 404
            
        project.is_active = not project.is_active
        db.session.commit()
        
        status = "activated" if project.is_active else "decommissioned"
        return jsonify({"message": f"Project successfully {status}", "is_active": project.is_active}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Toggle failed: {str(e)}"}), 500

@timesheets_blueprint.route('/assign-project', methods=['POST'])
@jwt_required()
def assign_project():
    data = request.get_json()
    employee_id = data.get('employee_id')
    project_id = data.get('project_id')
    
    if not employee_id or not project_id:
        return jsonify({"message": "Missing employee or project ID"}), 400
        
    target_user = User.query.get(employee_id)
    if not target_user:
        return jsonify({"message": "Employee not found"}), 404
        
    target_project = Project.query.get(project_id)
    if not target_project:
        return jsonify({"message": "Project not found"}), 404
        
    if not target_project.is_active:
        return jsonify({"message": "Cannot assign to a decommissioned project entity"}), 403
        
    # LOGIC: HR/Admin can assign anyone. Manager can only assign to their reports.
    is_authorized = current_user.is_admin_or_super or current_user.is_hr or \
                    (target_user.manager_id == current_user.id)
    
    if not is_authorized:
        return jsonify({"message": "Not authorized to assign projects to this employee"}), 403
        
    # Check if already assigned
    existing = ProjectAssignment.query.filter_by(user_id=employee_id, project_id=project_id).first()
    if existing:
        return jsonify({"message": "Already assigned"}), 400
        
    assignment = ProjectAssignment(user_id=employee_id, project_id=project_id)
    db.session.add(assignment)
    db.session.commit()
    return jsonify({"message": "Project assigned successfully"}), 201

@timesheets_blueprint.route('/employees-list', methods=['GET'])
@jwt_required()
def get_employees_for_assignment():
    # HR/Admin see everyone. Manager see reports.
    if current_user.is_admin_or_super or current_user.is_hr:
        employees = User.query.all()
    else:
        employees = User.query.filter_by(manager_id=current_user.id).all()
        
    return jsonify([{
        "id": e.id,
        "name": f"{e.first_name} {e.last_name}",
        "email": e.email
    } for e in employees]), 200

@timesheets_blueprint.route('/submit', methods=['POST'])
@jwt_required()
def submit_timesheet():
    user_id = get_jwt_identity()
    data = request.get_json()

    project_id = data.get('project_id')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    days_data = data.get('days', []) # List of {date, hours, ot_hours, notes}

    if not all([project_id, start_date_str, end_date_str]):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        start_date = parse_date_flexible(start_date_str)
        end_date = parse_date_flexible(end_date_str)
        
        if not start_date or not end_date:
            return jsonify({"message": "Invalid date format for start or end date"}), 400
    except Exception as e:
        return jsonify({"message": f"Date synchronization failure: {str(e)}"}), 400

    # 1. 31-day limit check
    if (end_date - start_date).days > 31:
        return jsonify({"message": "Date range cannot exceed 31 days"}), 400
    
    if start_date > end_date:
        return jsonify({"message": "Start date must be before end date"}), 400

    # 2. Project activity and assignment check
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404
        
    if not project.is_active:
        return jsonify({"message": "This project has been decommissioned and is no longer accepting submissions."}), 403

    assignment = ProjectAssignment.query.filter_by(user_id=user_id, project_id=project_id).first()
    if not assignment:
        return jsonify({"message": "You are not assigned to this project"}), 403

    # 3. Collision check (No overlapping sheets for the same user + project)
    # Statuses that block: PENDING, APPROVED
    overlapping = Timesheet.query.filter(
        Timesheet.user_id == user_id,
        Timesheet.project_id == project_id,
        Timesheet.status.in_(['PENDING', 'APPROVED']),
        Timesheet.start_date <= end_date,
        Timesheet.end_date >= start_date
    ).first()

    if overlapping:
        return jsonify({
            "message": f"Overlap detected with existing timesheet ({overlapping.start_date} to {overlapping.end_date})"
        }), 409

    # 4. Create Timesheet
    new_sheet = Timesheet(
        user_id=user_id,
        project_id=project_id,
        start_date=start_date,
        end_date=end_date,
        status='PENDING' # Direct submission
    )
    db.session.add(new_sheet)
    db.session.flush() # Get the sheet ID

    total_hours = 0
    for day in days_data:
        try:
            d_date = parse_date_flexible(day.get('date'))
            if not d_date:
                continue
            
            d_hours = float(day.get('hours', 0))
            d_ot = float(day.get('ot_hours', 0))
            
            # Basic validation: date must be within range
            if not (start_date <= d_date <= end_date):
                continue

            new_day = TimesheetDay(
                timesheet_id=new_sheet.id,
                date=d_date,
                hours=d_hours,
                ot_hours=d_ot,
                notes=day.get('notes', '')
            )
            db.session.add(new_day)
            total_hours += (d_hours + d_ot)
        except:
            continue

    new_sheet.total_hours = total_hours
    db.session.commit()

    return jsonify({
        "message": "Timesheet submitted successfully",
        "timesheet_id": new_sheet.id,
        "total_hours": total_hours
    }), 201

@timesheets_blueprint.route('/my-submissions', methods=['GET'])
@jwt_required()
def get_my_submissions():
    user_id = get_jwt_identity()
    sheets = Timesheet.query.filter_by(user_id=user_id).order_by(Timesheet.created_at.desc()).all()
    
    res = []
    from app.models.timesheet import ApprovalLog
    for s in sheets:
        latest_log = ApprovalLog.query.filter_by(timesheet_id=s.id, action=s.status).order_by(ApprovalLog.timestamp.desc()).first()
        if not latest_log:
            latest_log = ApprovalLog.query.filter_by(timesheet_id=s.id).filter(ApprovalLog.action.in_(['APPROVED', 'REJECTED'])).order_by(ApprovalLog.timestamp.desc()).first()
            
        reviewer_data = None
        if latest_log and latest_log.approver:
            reviewer_data = {
                "name": f"{latest_log.approver.first_name or ''} {latest_log.approver.last_name or ''}".strip() or latest_log.approver.email,
                "emp_id": f"EMP-{latest_log.approver.id:04d}",
                "department": latest_log.approver.department or "Core Management",
                "avatarUrl": latest_log.approver.avatar_medium_url or None
            }

        res.append({
            "id": s.id,
            "project_name": s.project.name,
            "project_is_active": s.project.is_active,
            "start_date": str(s.start_date),
            "end_date": str(s.end_date),
            "status": s.status,
            "total_hours": s.total_hours,
            "created_at": str(s.created_at),
            "reviewer": reviewer_data
        })
        
    return jsonify(res), 200

@timesheets_blueprint.route('/review-queue', methods=['GET'])
@jwt_required()
def get_review_queue():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Logic: If Manager, see reports. If HR, see all PENDING.
    is_hr = user.is_hr or user.is_admin_or_super
    
    query = Timesheet.query.filter_by(status='PENDING')
    
    if not is_hr:
        # Only team members
        report_ids = [u.id for u in user.reports]
        query = query.filter(Timesheet.user_id.in_(report_ids))
    
    sheets = query.all()
    
    return jsonify([{
        "id": s.id,
        "employee_name": f"{s.user.first_name} {s.user.last_name}",
        "project_name": s.project.name,
        "project_is_active": s.project.is_active,
        "start_date": str(s.start_date),
        "end_date": str(s.end_date),
        "total_hours": s.total_hours,
        "created_at": str(s.created_at)
    } for s in sheets]), 200

@timesheets_blueprint.route('/action', methods=['POST'])
@jwt_required()
def take_action():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    sheet_id = data.get('timesheet_id')
    action = data.get('action') # APPROVED, REJECTED
    comments = data.get('comments', '')
    
    if not all([sheet_id, action]):
        return jsonify({"message": "Missing fields"}), 400
        
    sheet = Timesheet.query.get(sheet_id)
    if not sheet:
        return jsonify({"message": "Timesheet not found"}), 404
        
    # Permission check: Manager or HR
    user = current_user
    is_authorized = (sheet.user.manager_id == user.id) or user.is_hr or user.is_admin_or_super
    
    if not is_authorized:
        return jsonify({"message": "Unauthorized to review this timesheet"}), 403
        
    sheet.status = action
    if action == 'APPROVED':
        sheet.is_readonly = True
        
    # Log the action
    log = ApprovalLog(
        timesheet_id=sheet.id,
        approver_id=user_id,
        action=action,
        comments=comments
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({"message": f"Timesheet {action.lower()} successfully"}), 200
@timesheets_blueprint.route('/details/<int:sheet_id>', methods=['GET'])
@jwt_required()
def get_timesheet_details(sheet_id):
    user_id = get_jwt_identity()
    sheet = Timesheet.query.get(sheet_id)
    
    if not sheet:
        return jsonify({"message": "Timesheet not found"}), 404
        
    # Permission check: Owner, Manager, or HR
    is_authorized = (sheet.user_id == int(user_id)) or \
                    (sheet.user.manager_id == int(user_id)) or \
                    current_user.is_hr or \
                    current_user.is_admin_or_super
    
    if not is_authorized:
        return jsonify({"message": "Unauthorized"}), 403
        
    days = TimesheetDay.query.filter_by(timesheet_id=sheet_id).order_by(TimesheetDay.date.asc()).all()
    
    # Fetch latest review comment, if any
    from app.models.timesheet import ApprovalLog
    latest_log = ApprovalLog.query.filter_by(timesheet_id=sheet_id, action=sheet.status).order_by(ApprovalLog.timestamp.desc()).first()
    
    # Check fallback if no specific action matches
    if not latest_log:
        latest_log = ApprovalLog.query.filter_by(timesheet_id=sheet_id).order_by(ApprovalLog.timestamp.desc()).first()
        
    review_comments = latest_log.comments if latest_log else None
    
    return jsonify({
        "id": sheet.id,
        "project_name": sheet.project.name,
        "project_is_active": sheet.project.is_active,
        "start_date": str(sheet.start_date),
        "end_date": str(sheet.end_date),
        "total_hours": sheet.total_hours,
        "status": sheet.status,
        "review_comments": review_comments,
        "days": [{
            "date": str(d.date),
            "hours": d.hours,
            "ot_hours": d.ot_hours,
            "notes": d.notes
        } for d in days]
    }), 200
@timesheets_blueprint.route('/resubmit', methods=['POST'])
@jwt_required()
def resubmit_timesheet():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    sheet_id = data.get('timesheet_id')
    days_data = data.get('days', [])
    
    if not sheet_id:
        return jsonify({"message": "Missing timesheet ID"}), 400
        
    sheet = Timesheet.query.get(sheet_id)
    if not sheet:
        return jsonify({"message": "Timesheet not found"}), 404
        
    if sheet.user_id != int(user_id):
        return jsonify({"message": "Unauthorized"}), 403
        
    if sheet.status != 'REJECTED':
        return jsonify({"message": "Only rejected timesheets can be resubmitted"}), 400
        
    # Process re-submission
    try:
        # Delete old days
        TimesheetDay.query.filter_by(timesheet_id=sheet_id).delete()
        
        total_hours = 0
        for day in days_data:
            d_date = parse_date_flexible(day.get('date'))
            if not d_date:
                continue
                
            d_hours = float(day.get('hours', 0))
            d_ot = float(day.get('ot_hours', 0))
            
            new_day = TimesheetDay(
                timesheet_id=sheet_id,
                date=d_date,
                hours=d_hours,
                ot_hours=d_ot,
                notes=day.get('notes', '')
            )
            db.session.add(new_day)
            total_hours += (d_hours + d_ot)
            
        sheet.status = 'PENDING'
        sheet.total_hours = total_hours
        sheet.is_readonly = False
        
        # Log the resubmission
        log = ApprovalLog(
            timesheet_id=sheet_id,
            approver_id=user_id, # Self-log
            action='RESUBMITTED',
            comments='Timesheet fixed and resubmitted'
        )
        db.session.add(log)
        
        db.session.commit()
        return jsonify({"message": "Timesheet resubmitted successfully", "total_hours": total_hours}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Resubmission failed: {str(e)}"}), 500

@timesheets_blueprint.route('/stats', methods=['GET'])
@jwt_required()
def get_performance_stats():
    user_id = get_jwt_identity()
    today = date.today()
    
    # Define current month range
    month = today.month
    year = today.year
    
    # 1. Total Cumulative Hours (MTD)
    # Statuses that contribute to performance: PENDING, APPROVED
    mtd_sheets = Timesheet.query.filter(
        Timesheet.user_id == user_id,
        Timesheet.status.in_(['PENDING', 'APPROVED']),
        extract('month', Timesheet.start_date) == month,
        extract('year', Timesheet.start_date) == year
    ).all()
    
    total_hours = sum(s.total_hours for s in mtd_sheets)
    
    # 2. Unique Active Days (MTD)
    active_days = db.session.query(func.count(TimesheetDay.date.distinct())).join(Timesheet).filter(
        Timesheet.user_id == user_id,
        Timesheet.status.in_(['PENDING', 'APPROVED']),
        extract('month', TimesheetDay.date) == month,
        extract('year', TimesheetDay.date) == year
    ).scalar() or 0
    
    # 3. Enterprise Metrics
    target_hours = 160.0 # Enterprise standard target
    efficiency_raw = (total_hours / target_hours) * 100 if target_hours > 0 else 0
    
    return jsonify({
        "total_hours": round(total_hours, 1),
        "target_hours": target_hours,
        "active_days": active_days,
        "efficiency_score": round(efficiency_raw, 1),
        "efficiency_label": f"{round(efficiency_raw, 1)}% Efficient",
        "period": today.strftime('%B %Y')
    }), 200
