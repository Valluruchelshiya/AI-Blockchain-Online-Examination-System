from flask import Blueprint, jsonify, request
from backend.extensions import db
from backend.models import User, Exam, ExamAttempt, CheatingIncident, Question

bp = Blueprint("admin", __name__, url_prefix="/admin")

@bp.route("/dashboard-stats", methods=["GET"])
def dashboard_stats():
    return jsonify({
        "totalExams": Exam.query.count(),
        "totalCandidates": User.query.count(),
        "completedAttempts": ExamAttempt.query.filter_by(status="COMPLETED").count(),
        "cheatingIncidents": CheatingIncident.query.count(),
        "activeProctoring": ExamAttempt.query.filter_by(status="IN_PROGRESS").count(),
    })


@bp.route("/recent-activities", methods=["GET"])
def recent_activities():
    return jsonify([
        {"id": 1, "type": "LOGIN", "detail": "Admin logged in", "time": "Just now"},
        {"id": 2, "type": "EXAM", "detail": "Exam created", "time": "2 min ago"}
    ])


@bp.route("/create-exam", methods=["POST"])
def create_exam():
    data = request.get_json()
    print("PARSED JSON:", data)

    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    exam = Exam(
        name=data["name"],
        description=data.get("description", ""),
        duration_minutes=data["duration_minutes"],
        total_marks=data["total_marks"],
        question_source_type=data["question_source_type"],
        created_by=1,
        status="DRAFT"
    )

    db.session.add(exam)
    db.session.commit()

    for q in data["questions"]:
        question = Question(
            exam_id=exam.id,
            text=q["text"],
            options=q["options"],
            correct_option_index=q["correct_option_index"],
            marks=q.get("marks", 1),
            source="MANUAL"
        )
        db.session.add(question)

    db.session.commit()

    return jsonify({"message": "Exam created", "exam_id": exam.id}), 201

@bp.route("/schedule", methods=["PUT"])
def schedule_exam():
    data = request.get_json()

    if not data or "exam_id" not in data:
        return jsonify({"error": "exam_id is required"}), 400

    exam_id = data["exam_id"]

    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"error": "Exam not found"}), 404

    exam.status = "ACTIVE"   # <-- ONLY this update
    db.session.commit()

    return jsonify({
        "message": "Exam status updated to ACTIVE",
        "exam_id": exam.id,
        "status": exam.status
    }), 200
    
@bp.route("/deactivate", methods=["PUT"])
def deactivate_exam():
    data = request.get_json()

    if not data or "exam_id" not in data:
        return jsonify({"error": "exam_id is required"}), 400

    exam_id = data["exam_id"]

    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"error": "Exam not found"}), 404

    exam.status = "CLOSED"   # <-- ONLY this update
    db.session.commit()

    return jsonify({
        "message": "Exam status updated to CLOSED",
        "exam_id": exam.id,
        "status": exam.status
    }), 200