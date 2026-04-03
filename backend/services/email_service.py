import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_email(to_email: str, subject: str, html_body: str):
    config = current_app.config
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = config["SMTP_USERNAME"]
    msg["To"] = to_email

    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(config["SMTP_SERVER"], config["SMTP_PORT"]) as server:
        if config["SMTP_USE_TLS"]:
            server.starttls()
        server.login(config["SMTP_USERNAME"], config["SMTP_PASSWORD"])
        server.send_message(msg)

def send_test_completion_email(user, exam_attempt, exam):
    subject = f"Regarding Test Submission – {exam.name}"
    body = f"""
    <p>Dear {user.name},</p>
    <p>Greetings from {exam.name}</p>
    <p>Your Test has been submitted <strong>{exam.name}</strong> Successfully.</p>
    <p>Your result will be published soon.</p>
    <p>Our team will shortly share further details regarding the result.</p>
    """
    send_email(user.email, subject, body) 