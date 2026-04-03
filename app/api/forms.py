from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.form_submission import FormSubmission
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

forms_blueprint = Blueprint('forms', __name__)


def _get_user():
    """Load verified user from JWT."""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    return user


@forms_blueprint.route('/submit', methods=['POST'])
@forms_blueprint.route('/<string:form_slug>', methods=['POST'])
@jwt_required()
def submit_form(form_slug='submit'):
    """
    Universal dynamic form submission endpoint.
    Accepts /api/v1/forms/submit OR /api/v1/forms/<any_slug>.
    """
    try:
        # Prevent collision with reserved words if they were POST (none currently)
        if form_slug == 'submissions' and request.method == 'POST':
            # In case we ever add a POST to /submissions
            pass

        user = _get_user()
        if not user:
            return jsonify({'message': 'User not found'}), 404
        if not user.company_id:
            return jsonify({'message': 'User is not associated with a company'}), 403

        body = request.get_json()
        if not body:
            return jsonify({'message': 'Empty request body'}), 400

        # Pull injected CMS metadata
        # Fallback to the URL slug if no explicit name is in the body
        form_name = body.pop('__form_name__', None)
        if not form_name:
            form_name = form_slug.capitalize() if form_slug != 'submit' else 'Unnamed Form'

        source_route = body.pop('__source_route__', '/')

        # Save the submission
        submission = FormSubmission(
            company_id=user.company_id,
            submitted_by=user.id,
            form_name=form_name,
            source_route=source_route,
            form_slug=form_slug,
            data=body
        )
        db.session.add(submission)
        db.session.commit()

        logger.info(f"Form submitted: slug={form_slug} form_name={form_name} user_id={user.id}")
        return jsonify({
            'message': f'Form "{form_name}" submitted successfully!',
            'submission_id': submission.id
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Form submission error: {str(e)}", exc_info=True)
        return jsonify({'message': f'Submission error: {str(e)}'}), 500


@forms_blueprint.route('/submissions', methods=['GET'])
@jwt_required()
def get_submissions():
    """
    Admin: view all form submissions for YOUR company only.
    SECURITY: Results are strictly scoped to the admin's own company_id.
    Optional filters: ?form_name=Leave+Request&source_route=/employee/dashboard
    """
    try:
        user = _get_user()
        if not user:
            return jsonify({'message': 'User not found'}), 404
        if not user.company_id:
            return jsonify({'message': 'User is not associated with a company'}), 403
        if not user.is_admin_or_super:
            return jsonify({'message': 'Admin access required'}), 403

        # Strict company isolation — never return another company's data
        query = FormSubmission.query.filter_by(company_id=user.company_id)

        # Optional filters
        form_name_filter = request.args.get('form_name')
        source_route_filter = request.args.get('source_route')

        if form_name_filter:
            query = query.filter_by(form_name=form_name_filter)
        if source_route_filter:
            query = query.filter_by(source_route=source_route_filter)

        submissions = query.order_by(FormSubmission.created_at.desc()).limit(200).all()

        return jsonify({
            'submissions': [s.to_dict() for s in submissions],
            'total': len(submissions),
            'company_id': user.company_id
        }), 200

    except Exception as e:
        logger.error(f"Error fetching submissions: {str(e)}", exc_info=True)
        return jsonify({'message': f'Error: {str(e)}'}), 500


@forms_blueprint.route('/submissions/<int:submission_id>', methods=['DELETE'])
@jwt_required()
def delete_submission(submission_id):
    """Admin: delete a specific form submission. Must belong to admin's own company."""
    try:
        user = _get_user()
        if not user or not user.is_admin_or_super:
            return jsonify({'message': 'Admin access required'}), 403

        # SECURITY: filter by BOTH id AND company_id
        submission = FormSubmission.query.filter_by(
            id=submission_id,
            company_id=user.company_id
        ).first()

        if not submission:
            return jsonify({'message': 'Submission not found'}), 404

        db.session.delete(submission)
        db.session.commit()
        return jsonify({'message': 'Submission deleted'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting submission: {str(e)}", exc_info=True)
        return jsonify({'message': f'Error: {str(e)}'}), 500
