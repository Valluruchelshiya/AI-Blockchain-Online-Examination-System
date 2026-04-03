from backend.extensions import db, socketio
from backend.models import ProctorLog, CheatingIncident, ExamAttempt

EVENT_WEIGHTS = {
    "TAB_SWITCH": 5,
    "FULLSCREEN_EXIT": 3,
    "DEVTOOLS_ATTEMPT": 8,
    "FORBIDDEN_SHORTCUT": 4,
}

THRESHOLD_MINOR = 10
THRESHOLD_MAJOR = 25

def log_proctor_event(attempt_id: int, event_type: str, event_details: dict, severity="LOW"):
    log = ProctorLog(
        attempt_id=attempt_id,
        event_type=event_type,
        event_details=event_details,
        severity=severity
    )
    db.session.add(log)

    attempt = ExamAttempt.query.get(attempt_id)
    if attempt:
        weight = EVENT_WEIGHTS.get(event_type, 1)
        attempt.suspicion_score = (attempt.suspicion_score or 0) + weight

        if attempt.suspicion_score >= THRESHOLD_MAJOR:
            _create_incident(attempt, "MAJOR_SUSPICION", attempt.suspicion_score)
        elif attempt.suspicion_score >= THRESHOLD_MINOR:
            _create_incident(attempt, "MINOR_SUSPICION", attempt.suspicion_score)

    db.session.commit()

    # push to admin via socket
    socketio.emit("proctor_event", {
        "attempt_id": attempt_id,
        "event_type": event_type,
        "event_details": event_details,
        "suspicion_score": attempt.suspicion_score if attempt else 0
    }, namespace="/admin")

def _create_incident(attempt: ExamAttempt, rule: str, score: float):
    incident = CheatingIncident(
        attempt_id=attempt.id,
        rule_triggered=rule,
        details={"suspicion_score": score},
        severity="HIGH" if score >= THRESHOLD_MAJOR else "MEDIUM"
    )
    db.session.add(incident)
