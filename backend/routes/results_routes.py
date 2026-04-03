from flask import Blueprint, jsonify
from backend.models import ExamAttempt

bp = Blueprint("results", __name__, url_prefix="/results")

@bp.route("/", methods=["GET"])
def get_results():
    attempts = ExamAttempt.query.all()
    result_list = []

    for a in attempts:
        result_list.append({
            "id": a.id,
            "user_id": a.user_id,
            "exam_id": a.exam_id,
            "score": a.score or 0,
            "percentile": a.percentile or 0,
            "status": a.status
        })

    return jsonify(result_list)
