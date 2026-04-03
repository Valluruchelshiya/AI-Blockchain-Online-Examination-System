from backend.models import Response, ExamAttempt, Exam, User
from backend.extensions import db
from backend.models import Question

def score_attempt(attempt):
    responses = Response.query.filter_by(attempt_id=attempt.id).all()

    total = 0
    for r in responses:
        question = Question.query.get(r.question_id)   # FIX
        if r.is_correct:
            total += question.marks
        else:
            total -= r.question.negative_marks
    attempt.score = max(0, total)
    db.session.commit()

def calculate_percentile(exam_id: int, attempt: ExamAttempt):
    attempts = ExamAttempt.query.filter_by(exam_id=exam_id, status="COMPLETED").all()
    scores = sorted([a.score for a in attempts])
    if not scores:
        attempt.percentile = 0.0
        db.session.commit()
        return

    less_or_equal = len([s for s in scores if s <= attempt.score])
    percentile = (less_or_equal / len(scores)) * 100.0
    attempt.percentile = percentile
    db.session.commit()
