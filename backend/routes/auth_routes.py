from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from email_validator import validate_email, EmailNotValidError

from backend.extensions import db
from backend.models import User, RoleEnum, ImageUpload
from backend.schemas import RegisterSchema, LoginSchema
from backend.blockchain_client import write_to_blockchain, compute_hash, canonical_json

bp = Blueprint("auth", __name__, url_prefix="/auth")

@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    print(data)
    errors = RegisterSchema().validate(data)
    print("Validation Errors:", errors)
    if errors:
        return jsonify({"errors": errors}), 400

    try:
        validate_email(data["email"])
    except EmailNotValidError as e:
        return jsonify({"error": str(e)}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already in use"}), 400

    user = User(
        name=data["name"],
        email=data["email"],
        mobile_number=data["mobile_number"],
        password_hash=generate_password_hash(data["password"]),
        role = RoleEnum[data["role"].upper()]
    )
    user_image = ImageUpload(
        email=data["email"],
        name=data["name"],
        image_base = data["image_base"],
    )
    db.session.add(user)
    print("User:-",user)
    db.session.commit()
    
    db.session.add(user_image)
    db.session.commit()
    print("User Image:- added to DB")

    # blockchain profile hash
    profile_data = {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "mobile_number": user.mobile_number
    }
    tx_hash = write_to_blockchain("USER_PROFILE", user.id, profile_data)
    user.blockchain_user_hash = compute_hash(profile_data)
    user.blockchain_tx_id = tx_hash
    db.session.commit()

    return jsonify({"message": "Registered successfully"}), 201


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    errors = LoginSchema().validate(data)
    if errors:
        return jsonify({"errors": errors}), 400

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    access = create_access_token(identity={"user_id": user.id, "role": user.role.value})
    #access = create_access_token(identity=str(user.id), additional_claims={"role": user.role.value})
    print("Access Token:", access)
    refresh = create_refresh_token(identity={"user_id": user.id, "role": user.role.value})
    return jsonify({
        "access_token": access,
        "refresh_token": refresh,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "mobile_number": user.mobile_number,
            "role": user.role.value
        }
    })