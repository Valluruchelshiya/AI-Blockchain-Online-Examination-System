
import cv2
from sqlalchemy import text
from face_engine import compare_faces
from yolo_engine import detect_objects

MAX_FACE_WARNINGS = 4
TERMINATION_SCORE = 50

def run_proctor(camera, known_encoding, attempt_id, engine, frame_callback=None):

    face_warnings = 0
    print("Starting proctoring loop...")

    while True:

        # ---------------- CHECK STATUS ----------------
        with engine.connect() as conn:
            attempt = conn.execute(
                text("""
                    SELECT status, suspicion_score 
                    FROM exam_attempts 
                    WHERE id = :id
                """),
                {"id": attempt_id}
            ).fetchone()

        if not attempt or attempt.status != "IN_PROGRESS":
            return "Exam Completed"

        ret, frame = camera.read()
        if not ret:
            continue

        # ---------------- FACE BOX ----------------
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

        # ---------------- FACE MATCH ----------------
        match = compare_faces(known_encoding, frame)

        if not match:
            face_warnings += 1
            update_score(engine, attempt_id, 20)

            cv2.putText(frame, "FACE NOT MATCHING!", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

            if face_warnings >= MAX_FACE_WARNINGS:
                terminate_exam(engine, attempt_id)
                return "Exam Terminated: Face mismatch"
        else:
            cv2.putText(frame, "Face Verified", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # ---------------- OBJECT DETECTION ----------------
        detected_objects = detect_objects(frame)

        for obj in detected_objects:
            label, x, y, w, h = obj

            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            cv2.putText(frame, label, (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)

            if label == "cell phone":
                update_score(engine, attempt_id, 15)
                log_event(engine, attempt_id, "MOBILE_DETECTED", label)

            elif label in ["earbuds", "headphones"]:
                update_score(engine, attempt_id, 12)
                log_event(engine, attempt_id, "HEADPHONES_DETECTED", label)

            elif label == "smartwatch":
                update_score(engine, attempt_id, 10)
                log_event(engine, attempt_id, "SMARTWATCH_DETECTED", label)

        # ---------------- TERMINATION ----------------
        with engine.connect() as conn:
            current = conn.execute(
                text("SELECT suspicion_score FROM exam_attempts WHERE id=:id"),
                {"id": attempt_id}
            ).fetchone()

        if current.suspicion_score >= TERMINATION_SCORE:
            terminate_exam(engine, attempt_id)
            return "Exam Terminated"

        # ✅ SEND FRAME (NO STREAMLIT HERE)
        if frame_callback:
            frame_callback(frame)


# ---------------- HELPERS ----------------

def update_score(engine, attempt_id, value):
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE exam_attempts 
                SET suspicion_score = suspicion_score + :value 
                WHERE id = :id
            """),
            {"value": value, "id": attempt_id}
        )

def terminate_exam(engine, attempt_id):
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE exam_attempts 
                SET status = 'TERMINATED' 
                WHERE id = :id
            """),
            {"id": attempt_id}
        )

def log_event(engine, attempt_id, event_type, obj):
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO proctor_logs
                (attempt_id, event_type, event_details, severity)
                VALUES (:attempt_id, :event_type, :details, 'HIGH')
            """),
            {
                "attempt_id": attempt_id,
                "event_type": event_type,
                "details": f'{{"object": "{obj}"}}'
            }
        )

