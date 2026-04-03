import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from backend.extensions import db
from backend.models import Exam, Question, ExamAttempt, Response, User
from backend.scoring_service import score_attempt, calculate_percentile
from backend.email_service import send_test_completion_email
from backend.blockchain_client import write_to_blockchain, compute_hash

bp = Blueprint("exams", __name__, url_prefix="/exams")

def _get_current_user():
    ident = get_jwt_identity()
    return User.query.get(ident["user_id"]) if ident else None

@bp.route("/get-drafts", methods=["GET"])
def list_exams():
    exams = Exam.query.filter_by().all()
    return jsonify([
        {
            "id": e.id,
            "name": e.name,
            "description": e.description,
            "duration_minutes": e.duration_minutes,
            "total_marks": e.total_marks,
            "status": e.status
        } for e in exams
    ])
    
@bp.route("/", methods=["GET"])
def list_active_exams():
    exams = Exam.query.filter_by(status="ACTIVE").all()
    return jsonify([
        {
            "id": e.id,
            "name": e.name,
            "description": e.description,
            "duration_minutes": e.duration_minutes,
            "total_marks": e.total_marks,
            "status": e.status
        } for e in exams
    ])

@bp.route("/<int:exam_id>/start", methods=["POST"])
def start_exam(exam_id):
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    # Find candidate by email
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    print("Starting exam for:", user.id, user.email)

    exam = Exam.query.get_or_404(exam_id)

    # Load questions
    questions = Question.query.filter_by(exam_id=exam.id).all()
    question_ids = [q.id for q in questions]
    random.shuffle(question_ids)

    # Create attempt
    attempt = ExamAttempt(
        user_id=user.id,
        exam_id=exam.id,
        question_order=question_ids
    )
    db.session.add(attempt)
    db.session.commit()

    # Shuffle options
    result_questions = []
    for qid in question_ids:
        q = next(q for q in questions if q.id == qid)
        options = list(enumerate(q.options))
        random.shuffle(options)

        option_texts = [opt[1] for opt in options]
        answer_mapping = {i: orig for i, (orig, _) in enumerate(options)}

        result_questions.append({
            "id": q.id,
            "text": q.text,
            "options": option_texts,
            "answer_mapping": answer_mapping
        })

    return jsonify({
        "attempt_id": attempt.id,
        "exam": {
            "id": exam.id,
            "name": exam.name,
            "duration_minutes": exam.duration_minutes
        },
        "questions": result_questions
    })

@bp.route("/attempts/<int:attempt_id>/answer", methods=["POST"])
def save_answer(attempt_id):
    data = request.get_json() or {}
    question_id = data.get("question_id")
    selected_index = data.get("selected_option_index")

    attempt = ExamAttempt.query.get_or_404(attempt_id)
    question = Question.query.get_or_404(question_id)

    is_correct = selected_index == question.correct_option_index

    existing = Response.query.filter_by(
        attempt_id=attempt.id,
        question_id=question.id
    ).first()

    if existing:
        existing.selected_option_index = selected_index
        existing.is_correct = is_correct
    else:
        r = Response(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_option_index=selected_index,
            is_correct=is_correct
        )
        db.session.add(r)

    db.session.commit()
    return jsonify({"message": "Answer saved"})

@bp.route("/attempts/<int:attempt_id>/submit", methods=["POST"])
def submit_attempt(attempt_id):
    attempt = ExamAttempt.query.get_or_404(attempt_id)
    exam = Exam.query.get_or_404(attempt.exam_id)
    user = User.query.get_or_404(attempt.user_id)

    score_attempt(attempt)
    attempt.status = "COMPLETED"
    db.session.commit()

    calculate_percentile(exam.id, attempt)

    # blockchain attempt
    attempt_data = {
        "attempt_id": attempt.id,
        "user_id": attempt.user_id,
        "exam_id": attempt.exam_id,
        "score": attempt.score,
        "percentile": attempt.percentile
    }
    tx_hash = write_to_blockchain("ATTEMPT", attempt.id, attempt_data)
    attempt.blockchain_attempt_hash = compute_hash(attempt_data)
    attempt.blockchain_tx_id = tx_hash
    db.session.commit()

    send_test_completion_email(user, attempt, exam)

    return jsonify({
        "message": "Attempt submitted",
        "score": attempt.score,
        "percentile": attempt.percentile
    })

@bp.route("/attempt/<int:attempt_id>", methods=["GET"])
def get_attempt(attempt_id):
    attempt = ExamAttempt.query.get_or_404(attempt_id)
    exam = Exam.query.get_or_404(attempt.exam_id)

    # get questions in same order
    order = attempt.question_order
    questions = Question.query.filter(Question.id.in_(order)).all()

    # reorder in attempt order
    ordered_questions = sorted(questions, key=lambda q: order.index(q.id))

    result = []
    for q in ordered_questions:
        result.append({
            "id": q.id,
            "text": q.text,
            "options": q.options
        })

    return jsonify({
        "exam": {
            "id": exam.id,
            "name": exam.name,
            "duration_minutes": exam.duration_minutes
        },
        "questions": result
    })
