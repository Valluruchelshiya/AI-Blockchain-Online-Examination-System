from datetime import datetime
from enum import Enum
from backend.extensions import db

class RoleEnum(str, Enum):
    ADMIN = "ADMIN"
    CANDIDATE = "CANDIDATE"
    EXAMINER = "EXAMINER"

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    mobile_number = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(RoleEnum), nullable=False, default=RoleEnum.CANDIDATE)
    blockchain_user_hash = db.Column(db.String(255))
    blockchain_tx_id = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Exam(db.Model):
    __tablename__ = "exams"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    duration_minutes = db.Column(db.Integer, nullable=False)
    total_marks = db.Column(db.Float, nullable=False)
    difficulty_config = db.Column(db.JSON)
    question_source_type = db.Column(db.String(50))  # STATIC / BANK / AI
    status = db.Column(db.String(50), default="DRAFT")
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Question(db.Model):
    __tablename__ = "questions"
    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=True)
    text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False)
    correct_option_index = db.Column(db.Integer, nullable=False)
    difficulty_level = db.Column(db.String(20))  # EASY/MEDIUM/HARD
    source = db.Column(db.String(20), default="MANUAL")  # MANUAL/AI
    topic_tags = db.Column(db.JSON)
    marks = db.Column(db.Float, default=1.0)
    negative_marks = db.Column(db.Float, default=0.0)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ExamAttempt(db.Model):
    __tablename__ = "exam_attempts"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    score = db.Column(db.Float)
    percentile = db.Column(db.Float)
    status = db.Column(db.String(50), default="IN_PROGRESS")  # IN_PROGRESS/COMPLETED/DISQUALIFIED
    suspicion_score = db.Column(db.Float, default=0)
    question_order = db.Column(db.JSON)  # list of question IDs in order
    blockchain_attempt_hash = db.Column(db.String(255))
    blockchain_tx_id = db.Column(db.String(255))

class Response(db.Model):
    __tablename__ = "responses"
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("exam_attempts.id"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False)
    selected_option_index = db.Column(db.Integer)
    is_correct = db.Column(db.Boolean)
    answered_at = db.Column(db.DateTime, default=datetime.utcnow)
    question = db.relationship("Question")

class ProctorLog(db.Model):
    __tablename__ = "proctor_logs"
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("exam_attempts.id"), nullable=False)
    event_type = db.Column(db.String(100), nullable=False)
    event_details = db.Column(db.JSON)
    severity = db.Column(db.String(20), default="LOW")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class BrowserActivitySnapshot(db.Model):
    __tablename__ = "browser_activity_snapshots"
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("exam_attempts.id"), nullable=False)
    screenshot_url = db.Column(db.String(255))
    captured_at = db.Column(db.DateTime, default=datetime.utcnow)
    blockchain_snapshot_hash = db.Column(db.String(255))
    blockchain_tx_id = db.Column(db.String(255))

class CheatingIncident(db.Model):
    __tablename__ = "cheating_incidents"
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("exam_attempts.id"), nullable=False)
    rule_triggered = db.Column(db.String(255))
    details = db.Column(db.JSON)
    severity = db.Column(db.String(20), default="MEDIUM")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Certificate(db.Model):
    __tablename__ = "certificates"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=False)
    certificate_uid = db.Column(db.String(100), unique=True, nullable=False)
    result_status = db.Column(db.String(50))  # CLEARED/FAILED/WITHHELD/ON_HOLD
    certificate_url = db.Column(db.String(255))
    blockchain_certificate_hash = db.Column(db.String(255))
    blockchain_tx_id = db.Column(db.String(255))
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)

class BlockchainTransaction(db.Model):
    __tablename__ = "blockchain_transactions"
    id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(50))
    entity_id = db.Column(db.Integer)
    hash_value = db.Column(db.String(255))
    blockchain_tx_hash = db.Column(db.String(255))
    blockchain_ref = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ImageUpload(db.Model):
    __tablename__ = "image_uploads"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    image_base = db.Column(db.Text, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)