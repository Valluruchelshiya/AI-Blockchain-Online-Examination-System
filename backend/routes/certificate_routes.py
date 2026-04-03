import uuid
from datetime import datetime
from flask import Blueprint, jsonify, send_file, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from backend.extensions import db
from backend.models import Certificate, ExamAttempt, Exam, User, RoleEnum
from backend.blockchain_client import write_to_blockchain, compute_hash, verify_against_blockchain
import os

bp = Blueprint("certificates", __name__, url_prefix="/certificates")

# ---------------------------------------------------------
#   LIST COMPLETED EXAM ATTEMPTS (Admin Only)
# ---------------------------------------------------------
@bp.route("/completed-attempts", methods=["GET"])
def list_completed_attempts():
    attempts = (
        ExamAttempt.query
        .filter(ExamAttempt.status == "COMPLETED")
        .order_by(ExamAttempt.end_time.desc())
        .all()
    )

    data = []
    for a in attempts:
        user = User.query.get(a.user_id)
        exam = Exam.query.get(a.exam_id)

        data.append({
            "attempt_id": a.id,
            "user_id": user.id,
            "user_name": user.name,
            "exam_name": exam.name,
            "score": a.score,
            "completed_at": a.end_time.isoformat() if a.end_time else None
        })
        print("ATTEMPT DATA:", data)
    return jsonify(data)

@bp.route("/issue/<int:attempt_id>", methods=["POST"])
def issue_certificate(attempt_id):
    attempt = ExamAttempt.query.get_or_404(attempt_id)

    if attempt.status != "COMPLETED":
        return jsonify({"error": "Exam attempt not completed"}), 400

    # Prevent duplicate certificates
    existing = Certificate.query.filter_by(
        user_id=attempt.user_id,
        exam_id=attempt.exam_id
    ).first()

    if existing:
        return jsonify({"error": "Certificate already issued"}), 400

    user = User.query.get(attempt.user_id)
    exam = Exam.query.get(attempt.exam_id)

    cert_uid = str(uuid.uuid4())
    result_status = "COMPLETED"

    # Certificate PDF path
    dest_folder = "C:/projects2k26/online-exam-system/certificates/"
    if not os.path.exists(dest_folder):
        os.makedirs(dest_folder)
    pdf_path = os.path.join(dest_folder, f"{cert_uid}.pdf")

    # -------------------------
    # Generate a basic certificate PDF using ReportLab
    # -------------------------

    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width / 2, height - 100, "Certificate of Completion")

    # Subtitle / System Name
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 130, "Online Exam System")

    # Certificate Details
    c.setFont("Helvetica", 12)
    text_y = height - 180
    c.drawString(100, text_y, f"This is to certify that {user.name}")
    text_y -= 20
    c.drawString(100, text_y, f"has successfully completed the exam '{exam.name}'")
    text_y -= 20
    c.drawString(100, text_y, f"with a status: {result_status}.")
    text_y -= 20
    c.drawString(100, text_y, f"Score: {attempt.score}")
    text_y -= 20
    c.drawString(100, text_y, f"Issued on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Save PDF
    c.save()

    # Store certificate in DB
    cert = Certificate(
        user_id=user.id,
        exam_id=exam.id,
        certificate_uid=cert_uid,
        result_status=result_status,
        certificate_url=pdf_path
    )

    db.session.add(cert)
    db.session.commit()

    # Blockchain log
    cert_data = {
        "certificate_uid": cert.certificate_uid,
        "user_name": user.name,
        "exam_name": exam.name,
        "result_status": cert.result_status,
        "issued_at": cert.issued_at.isoformat()
    }

    tx_hash = write_to_blockchain("CERTIFICATE", cert.id, cert_data)

    cert.blockchain_certificate_hash = compute_hash(cert_data)
    cert.blockchain_tx_id = tx_hash
    db.session.commit()

    return jsonify({
        "message": "Certificate issued successfully",
        "certificate_uid": cert.certificate_uid,
        "user_name": user.name,
        "exam_name": exam.name
    }), 201

# ---------------------------------------------------------
#   VERIFY CERTIFICATE PUBLICLY
# ---------------------------------------------------------
@bp.route("/verify/<string:certificate_uid>", methods=["GET"])
def verify_certificate(certificate_uid):
    cert = Certificate.query.filter_by(certificate_uid=certificate_uid).first_or_404()
    user = User.query.get_or_404(cert.user_id)
    exam = Exam.query.get_or_404(cert.exam_id)

    cert_data = {
        "certificate_uid": cert.certificate_uid,
        "user_name": user.name,
        "exam_name": exam.name,
        "result_status": cert.result_status,
        "issued_at": cert.issued_at.isoformat()
    }

    valid = verify_against_blockchain("CERTIFICATE", cert.id, cert_data)

    return jsonify({
        "valid": valid,
        "certificate": {
            "certificate_uid": cert.certificate_uid,
            "user_name": user.name,
            "exam_name": exam.name,
            "result_status": cert.result_status,
            "blockchain_valid": valid,
            "issued_at": cert.issued_at.isoformat(),
        }
    })


# ---------------------------------------------------------
#   GET CERTIFICATES FOR LOGGED-IN STUDENT
# ---------------------------------------------------------
@bp.route("/my", methods=["GET"])
def my_certificates():
    user_id = request.args.get("user_id", type=int)

    certs = Certificate.query.filter_by(user_id=user_id).all()
    data = []

    for c in certs:
        exam = Exam.query.get(c.exam_id)

        data.append({
            "id": c.id,
            "certificate_uid": c.certificate_uid,
            "exam_name": exam.name,
            "result_status": c.result_status,
            "certificate_url": c.certificate_url,
            "issued_at": c.issued_at.isoformat()
        })

    return jsonify(data)


# ---------------------------------------------------------
#   GET SINGLE CERTIFICATE DETAILS
# ---------------------------------------------------------
@bp.route("/download/<int:cert_id>", methods=["GET"])
def download_certificate(cert_id):
    cert = Certificate.query.get_or_404(cert_id)

    pdf_path = cert.certificate_url

    if not pdf_path or not os.path.exists(pdf_path):
        return jsonify({"error": "Certificate file not found"}), 404

    return send_file(
        pdf_path,
        as_attachment=True,
        download_name=f"certificate_{cert.certificate_uid}.pdf",
        mimetype="application/pdf"
    )
