import json
from sqlalchemy import text
from datetime import datetime


# -------------------------------------------------
# FETCH ACTIVE EXAMS
# -------------------------------------------------

def get_active_exams(engine):
    with engine.connect() as conn:
        return conn.execute(
            text("""
                SELECT id, name, description, duration_minutes
                FROM exams
                WHERE status = 'ACTIVE'
            """)
        ).fetchall()


# -------------------------------------------------
# GET OR CREATE ATTEMPT (RESUME LOGIC)
# -------------------------------------------------

def get_or_create_attempt(engine, user_id, exam_id):

    with engine.begin() as conn:

        existing = conn.execute(
            text("""
                SELECT id
                FROM exam_attempts
                WHERE user_id = :user_id
                  AND exam_id = :exam_id
                  AND status = 'IN_PROGRESS'
                ORDER BY start_time DESC
                LIMIT 1
            """),
            {"user_id": user_id, "exam_id": exam_id}
        ).fetchone()

        if existing:
            return existing.id, "RESUME"

        result = conn.execute(
            text("""
                INSERT INTO exam_attempts
                (user_id, exam_id, status, suspicion_score, start_time)
                VALUES (:user_id, :exam_id, 'IN_PROGRESS', 0, :start_time)
            """),
            {
                "user_id": user_id,
                "exam_id": exam_id,
                "start_time": datetime.utcnow()
            }
        )

        return result.lastrowid, "NEW"


# -------------------------------------------------
# GET QUESTIONS (✔ FIXED)
# -------------------------------------------------

def get_questions(engine, exam_id):

    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT 
                    id,
                    text,
                    options,
                    correct_option_index,
                    marks,
                    negative_marks
                FROM questions
                WHERE exam_id = :exam_id
            """),
            {"exam_id": exam_id}
        ).fetchall()

    questions = []

    for row in rows:
        questions.append({
            "id": row.id,
            "question": row.text,                     # ✅ CORRECT
            "options": json.loads(row.options),       # JSON → list
            "correct": row.correct_option_index,      # ✅ CORRECT
            "marks": row.marks or 1,
            "negative": row.negative_marks or 0
        })

    return questions


# -------------------------------------------------
# SUBMIT EXAM
# -------------------------------------------------

def submit_exam(engine, attempt_id, answers, suspicion_score):

    with engine.begin() as conn:

        rows = conn.execute(
            text("""
                SELECT q.id, q.correct_option_index, q.marks, q.negative_marks
                FROM responses r
                JOIN questions q ON r.question_id = q.id
                WHERE r.attempt_id = :attempt_id
            """),
            {"attempt_id": attempt_id}
        ).fetchall()

        score = 0
        total = 0

        for r in rows:
            total += r.marks
            if answers.get(str(r.id)) == r.correct_option_index:
                score += r.marks
            else:
                score -= r.negative_marks or 0

        percentile = (score / total) * 100 if total > 0 else 0

        conn.execute(
            text("""
                UPDATE exam_attempts
                SET
                    score = :score,
                    percentile = :percentile,
                    end_time = :end_time,
                    status = 'COMPLETED'
                WHERE id = :id
            """),
            {
                "score": score,
                "percentile": percentile,
                "end_time": datetime.utcnow(),
                "id": attempt_id
            }
        )

    return score, percentile