from functools import wraps
from flask_jwt_extended import current_user
from flask import jsonify

def require_role(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            if not any(current_user.has_role(role) for role in roles):
                return jsonify(message='You are not authorized to perform this action'), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
