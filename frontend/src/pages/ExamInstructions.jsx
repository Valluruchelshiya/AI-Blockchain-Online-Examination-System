import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import Card from "../components/Card";
import Button from "../components/Button";

export default function ExamInstructions() {
  const { examId } = useParams();
  const nav = useNavigate();
  const [exam, setExam] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    apiFetch("/exams")
      .then((list) => {
        const found = list.find((e) => e.id === Number(examId));
        setExam(found);
      })
      .catch(console.error);
  }, [examId]);

  const handleStartClick = () => {
    setShowPopup(true); // show email popup
  };

  const confirmStart = async () => {
    if (!email.trim()) {
      alert("Please enter your email before starting the exam.");
      return;
    }

    try {
      const data = await apiFetch(`/exams/${examId}/start`, {
        method: "POST",
        body: JSON.stringify({ email }),  // 🔥 sending email
      });

      nav(`/candidate/exams/${examId}/attempt/${data.attempt_id}`, {
        state: data,
      });
    } catch (err) {
      console.error(err);
      alert("Unable to start the exam. Please try again.");
    }
  };

  if (!exam) return <p>Loading exam details...</p>;

  return (
    <>
      <Card>
        <h2>{exam.name} – Instructions</h2>

        <p><b>Duration:</b> {exam.duration_minutes} minutes</p>
        <p><b>Total Marks:</b> {exam.total_marks}</p>

        <ul style={{ marginTop: "15px" }}>
          <li>The exam will enter fullscreen mode.</li>
          <li>Tab switching and copy/paste are not allowed.</li>
          <li>Suspicious activity may disqualify you.</li>
          <li>You must complete the exam in one attempt.</li>
        </ul>

        <Button onClick={handleStartClick} style={{ marginTop: "20px" }}>
          Start Exam
        </Button>
      </Card>

      {showPopup && (
        <div className="popup-backdrop">
          <div className="popup-box">
            <h3>Enter Email to Start Exam</h3>
            <input
              type="email"
              placeholder="Enter registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="email-input"
            />
            <div className="popup-actions">
              <Button onClick={confirmStart}>Start Now</Button>
              <Button
                style={{ background: "gray" }}
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
