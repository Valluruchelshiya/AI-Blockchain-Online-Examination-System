import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useProctoring } from "../hooks/useProctoring";
import Card from "../components/Card";
import Button from "../components/Button";
import QuestionNavigator from "../components/QuestionNavigator";
import ProgressBar from "../components/ProgressBar";

export default function ExamPlayer() {
  const { examId, attemptId } = useParams();
  const nav = useNavigate();

  const [examData, setExamData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  // Enable Proctoring
  useProctoring({ attemptId: Number(attemptId), enableScreenShare: true });

  // Load exam attempt once
  useEffect(() => {
    apiFetch(`/exams/attempt/${attemptId}`)
      .then((data) => {
        console.log("Exam Data:", data);
        setExamData(data);
        setTimeLeft(data.exam.duration_minutes * 60);
      })
      .catch(console.error);
  }, [attemptId]);

  // Enter fullscreen (MUST be user initiated)
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsStarted(true);
    } catch (err) {
      alert("Fullscreen is required to start the exam.");
    }
  };

  // Detect fullscreen exit
  useEffect(() => {
    const onFullscreenChange = () => {
      if (isStarted && !document.fullscreenElement) {
        alert("You exited fullscreen. Please return to fullscreen.");
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [isStarted]);

  // Timer countdown (starts only after exam starts)
  useEffect(() => {
    if (!isStarted || timeLeft === null) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isStarted]);

  if (!examData) return <p>Loading exam...</p>;

  // Start screen (fullscreen gate)
  if (!isStarted) {
    return (
      <div className="exam-start-screen">
        <Card>
          <h2>{examData.exam.name}</h2>
          <p>This exam must be taken in fullscreen mode.</p>

          <Button onClick={enterFullscreen}>
            Start Exam (Fullscreen)
          </Button>
        </Card>
      </div>
    );
  }

  const { exam, questions } = examData;
  const currentQuestion = questions[currentIndex];

  // Save answer
  const handleOptionClick = async (idx) => {
    setAnswers({ ...answers, [currentQuestion.id]: idx });

    await apiFetch(`/exams/attempts/${attemptId}/answer`, {
      method: "POST",
      body: JSON.stringify({
        question_id: currentQuestion.id,
        selected_option_index: idx,
      }),
    });
  };

  // Submit exam
  const handleSubmit = async () => {
    try {
      const res = await apiFetch(`/exams/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      alert(`Exam submitted! Score: ${res.score}`);
      nav("/candidate/results");
    } catch (err) {
      console.error(err);
      alert("Error submitting exam");
    }
  };

  const progress =
    (timeLeft / (exam.duration_minutes * 60)) * 100;

  return (
    <div className="exam-player">
      <div className="exam-header">
        <h2>{exam.name}</h2>

        <div className="exam-timer">
          <span>
            Time left: {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </span>
          <ProgressBar value={progress} />
        </div>
      </div>

      <div className="exam-body">
        <Card>
          <div className="question-text">
            <span>Q{currentIndex + 1}.</span>{" "}
            {currentQuestion.text}
          </div>

          <div className="options-list">
            {currentQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                className={
                  "option-btn" +
                  (answers[currentQuestion.id] === idx
                    ? " option-selected"
                    : "")
                }
                onClick={() => handleOptionClick(idx)}
              >
                {opt}
              </button>
            ))}
          </div>
        </Card>

        <div className="exam-sidebar">
          <QuestionNavigator
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />

          <Button onClick={handleSubmit} fullWidth>
            Submit Exam
          </Button>
        </div>
      </div>
    </div>
  );
}
