import cv2
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.proctor_service import log_proctor_event
from backend.extensions import db
from backend.models import BrowserActivitySnapshot

bp = Blueprint("proctor", __name__, url_prefix="/proctor")

@bp.route("/events", methods=["POST"])
def proctor_event():
    data = request.get_json() or {}
    attempt_id = data.get("attempt_id")
    event_type = data.get("event_type")
    event_details = data.get("event_details", {})
    log_proctor_event(attempt_id, event_type, event_details)
    return jsonify({"message": "event logged"})

@bp.route("/screenshot", methods=["POST"])
def screenshot():
    """
    Expect screenshot as base64 or URL in request. For simplicity, only URL here.
    """
    data = request.get_json() or {}
    print("Received screenshot data:", data);
    attempt_id = data.get("attempt_id")
    screenshot_url = data.get("screenshot_url")
    if not screenshot_url:
        return jsonify({"error": "screenshot_url required"}), 400

    snap = BrowserActivitySnapshot(
        attempt_id=attempt_id,
        screenshot_url=screenshot_url
    )
    db.session.add(snap)
    db.session.commit()
    return jsonify({"message": "screenshot stored"})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
cascade_path = os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml")
face_cascade = cv2.CascadeClassifier(cascade_path)

@bp.route("/capture_face", methods=["POST"])
def capture_face():
    data = request.get_json() or {}
    student_id = data.get("student_id")

    if not student_id:
        return jsonify({"error": "student_id required"}), 400

    cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)

    if not os.path.exists("faces"):
        os.makedirs("faces")

    ret, frame = cam.read()
    if not ret:
        cam.release()
        return jsonify({"message": "Camera error"})

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        cam.release()
        return jsonify({"message": "No face detected"})

    (x, y, w, h) = faces[0]
    face_img = frame[y:y+h, x:x+w]

    faces_dir = os.path.join(BASE_DIR, "faces")
    if not os.path.exists(faces_dir):
        os.makedirs(faces_dir)

    filename = os.path.join(faces_dir, f"{student_id}.jpg")

    cv2.imwrite(filename, face_img)

    cam.release()
    cv2.destroyAllWindows()

    return jsonify({"message": "Face captured successfully"})

