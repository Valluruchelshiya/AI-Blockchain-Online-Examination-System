from flask import Blueprint, jsonify, request
from backend.extensions import db
from backend.models import User, ExamAttempt, Exam
from backend.email_service import send_email

bp = Blueprint("admin_results", __name__, url_prefix="/admin/results")

@bp.route("/", methods=["GET"])
def get_all_results():
    attempts = db.session.query(
        ExamAttempt,
        User,
        Exam
    ).join(User, User.id == ExamAttempt.user_id)\
     .join(Exam, Exam.id == ExamAttempt.exam_id)\
     .filter(ExamAttempt.status == "COMPLETED")\
     .all()

    results = []
    for att, user, exam in attempts:
        results.append({
            "attempt_id": att.id,
            "user_id": user.id,
            "candidate_name": user.name,
            "email": user.email,
            "exam_name": exam.name,
            "score": att.score,
            "percentile": att.percentile,
        })

    return jsonify(results)


@bp.route("/notify", methods=["POST"])
def notify_candidates():
    data = request.get_json()
    selected = data.get("selected", [])
    rejected = data.get("rejected", [])

    # send emails
    for s in selected:
        send_email(
            to_email=s['email'],
            subject="🎉 Congratulations! You Are Selected!",
            html_body=f"""
                Dear {s['candidate_name']},

                Congratulations! You are selected based on your performance.

                Score: {s['score']}
                Percentile: {s['percentile']}

                We will contact you soon with further steps.

                Regards,
                Admin
                """
            )

    for r in rejected:
        send_email(
            to_email=r['email'],
            subject="Result – Thank You for Attending",
            html_body=f"""
                Dear {r['candidate_name']},

                Thank you for participating in the exam.

                Unfortunately, you have not been shortlisted.

                Score: {r['score']}
                Percentile: {r['percentile']}

                We wish you all the best for your future!

                Regards,
                Admin
                """
            )

    return jsonify({"message": "Emails sent successfully"})
