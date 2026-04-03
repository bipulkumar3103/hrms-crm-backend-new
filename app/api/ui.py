from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.ui_metadata import UIMetadata
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

ui_blueprint = Blueprint('ui', __name__)

def _get_verified_user(require_company=True):
    """Helper: load & validate user, optionally enforce company membership."""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return None, (jsonify({"message": "User not found"}), 404)
    if require_company and not user.company_id:
        return None, (jsonify({"message": "User is not associated with a company"}), 403)
    return user, None


@ui_blueprint.route('/layout', methods=['GET'])
@jwt_required()
def get_layout():
    """
    Loads a layout for a given route.
    Priority: Company-specific override > Global default > Empty fallback.
    Strict company isolation: a user of Company A can never see Company B's layouts.
    """
    route = request.args.get('route', '/')
    user, err = _get_verified_user(require_company=True)
    if err:
        return err

    # 1. Company-specific override ONLY for this user's own company
    company_layout = UIMetadata.query.filter_by(
        company_id=user.company_id,
        page_route=route,
        is_global=False
    ).first()

    if company_layout:
        logger.info(f"Serving custom layout: route={route} company_id={user.company_id}")
        return jsonify({
            "is_custom": True,
            "route": route,
            "schema": company_layout.ui_config
        }), 200

    # 2. Fallback to global system default (no company_id, is_global=True).
    #    Global layouts are PLATFORM templates, not company data.
    global_layout = UIMetadata.query.filter_by(
        is_global=True,
        page_route=route
    ).first()

    if global_layout:
        logger.info(f"Serving global default layout: route={route}")
        return jsonify({
            "is_custom": False,
            "route": route,
            "schema": global_layout.ui_config
        }), 200

    # 3. No layout exists: return empty schema — SchemaEngine will show empty state
    return jsonify({
        "is_custom": False,
        "route": route,
        "schema": {"components": []}
    }), 200


@ui_blueprint.route('/builder/layouts', methods=['GET'])
@jwt_required()
def list_builder_layouts():
    """
    Returns ALL configurable routes for the CURRENT admin's company only.
    - Company-specific saved routes (scoped strictly to this company)
    - Global default routes (platform templates, read-only labels)
    - Built-in employee-facing routes as defaults suggestions
    """
    user, err = _get_verified_user(require_company=True)
    if err:
        return err

    if not user.is_admin_or_super:
        return jsonify({"message": "Admin access required"}), 403

    # Only this company's saved layouts
    company_layouts = UIMetadata.query.filter_by(
        company_id=user.company_id,
        is_global=False
    ).all()
    company_routes = set(layout.page_route for layout in company_layouts)

    # Global platform-default templates (shared across all companies, read-only)
    global_layouts = UIMetadata.query.filter_by(is_global=True).all()
    global_routes = set(layout.page_route for layout in global_layouts)

    # Always include core employee routes as suggestions so admins can start immediately
    built_in_routes = {'/employee/dashboard', '/employee/directory', '/employee/announcements'}

    all_routes = sorted(company_routes | global_routes | built_in_routes)
    logger.info(f"Admin {user.id} (company {user.company_id}) listing {len(all_routes)} routes")
    return jsonify({"routes": all_routes}), 200


@ui_blueprint.route('/builder/layout', methods=['POST'])
@jwt_required()
def save_custom_layout():
    """Save or update a layout for this admin's company. Strictly company-scoped."""
    user, err = _get_verified_user(require_company=True)
    if err:
        return err

    if not user.is_admin_or_super:
        return jsonify({"message": "Admin access required"}), 403

    data = request.get_json()
    route = data.get('route')
    schema = data.get('schema')

    if not route or not schema:
        return jsonify({"message": "Missing 'route' or 'schema'"}), 400

    # SECURITY: Always save with this admin's company_id — never allow override
    layout = UIMetadata.query.filter_by(
        company_id=user.company_id,
        page_route=route,
        is_global=False
    ).first()

    if layout:
        layout.ui_config = schema
        logger.info(f"Updated layout: route={route} company_id={user.company_id}")
    else:
        layout = UIMetadata(
            company_id=user.company_id,
            page_route=route,
            is_global=False,
            ui_config=schema
        )
        db.session.add(layout)
        logger.info(f"Created layout: route={route} company_id={user.company_id}")

    db.session.commit()
    return jsonify({"message": "Layout saved successfully"}), 200


@ui_blueprint.route('/builder/layout', methods=['DELETE'])
@jwt_required()
def delete_custom_layout():
    """Delete a layout. Can only delete layouts belonging to admin's own company."""
    user, err = _get_verified_user(require_company=True)
    if err:
        return err

    if not user.is_admin_or_super:
        return jsonify({"message": "Admin access required"}), 403

    route = request.args.get('route')
    if not route:
        return jsonify({"message": "Missing 'route' query parameter"}), 400

    # SECURITY: Strictly filter by company_id + is_global=False
    # This prevents accidentally deleting a global platform template
    layout = UIMetadata.query.filter_by(
        company_id=user.company_id,
        page_route=route,
        is_global=False
    ).first()

    if not layout:
        return jsonify({"message": "No custom layout found for this route in your company"}), 404

    db.session.delete(layout)
    db.session.commit()

    logger.info(f"Deleted layout: route={route} company_id={user.company_id}")
    return jsonify({"message": "Custom layout deleted. Employees will see the default view."}), 200
