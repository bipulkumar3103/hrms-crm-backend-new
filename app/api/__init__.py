from flask import Blueprint

api_blueprint = Blueprint('api', __name__)

from .auth import auth_blueprint
from .employees import employees_blueprint
from .company import company_blueprint
from .users import users_blueprint

api_blueprint.register_blueprint(auth_blueprint, url_prefix='/auth')
api_blueprint.register_blueprint(employees_blueprint, url_prefix='/employees')
api_blueprint.register_blueprint(company_blueprint, url_prefix='/company')
api_blueprint.register_blueprint(users_blueprint, url_prefix='/users')
