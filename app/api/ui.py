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

    # 1. Fetch custom layouts for THIS company
    company_routes = { r.page_route for r in UIMetadata.query.filter_by(
        company_id=user.company_id, 
        is_global=False
    ).all() }

    # 2. Fetch global defaults from platform templates
    global_routes = { r.page_route for r in UIMetadata.query.filter_by(
        is_global=True
    ).all() }

    # 3. Standard suggested routes for easy discovery
    suggested_routes = {'/employee/dashboard', '/employee/profile', '/employee/reports'}

    # Combine and sort all unique routes
    all_paths = sorted(list(company_routes | global_routes | suggested_routes))

    route_details = []
    for path in all_paths:
        route_details.append({
            "path": path,
            "is_custom": path in company_routes,
            "has_global": path in global_routes
        })

    logger.info(f"Admin {user.id} (company {user.company_id}) listing {len(route_details)} routes")
    return jsonify({"routes": route_details}), 200


@ui_blueprint.route('/context', methods=['GET'])
@jwt_required()
def get_ui_context():
    """Returns a unified data object containing both user profile and company theme details."""
    user, err = _get_verified_user(require_company=True)
    if err:
        return err

    company = user.company
    
    # Merge user data and company theme/branding data
    context = {
        # User details - Used for Dynamic String Resolution ({{first_name}})
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': f"{user.first_name} {user.last_name}",
        'email': user.email,
        'job_title': user.job_title,
        'department': user.department,
        'avatar_url': user.avatar_medium_url,
        
        # Company theme & branding - Used for Component Styling (theme_primary_color)
        'company_name': company.name,
        'theme_primary_color': company.theme_primary_color,
        'theme_secondary_color': company.theme_secondary_color,
        'theme_accent_color': company.theme_accent_color,
        'theme_bg_color': company.theme_bg_color,
        'theme_text_color': company.theme_text_color,
        'logo_url': company.logo_medium_url
    }
    
    logger.info(f"Serving unified UI context for user {user.id}")
    return jsonify(context), 200


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
