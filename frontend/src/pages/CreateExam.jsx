import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import "./CreateExam.css";

export default function CreateExam() {
  const nav = useNavigate();

  const [exam, setExam] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    total_marks: 100,
    question_source_type: "MANUAL",
  });

  const [questions, setQuestions] = useState([]);

  const [newQ, setNewQ] = useState({
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct_option: 0,
    marks: 1,
  });

  const handleExamChange = (e) => {
    setExam({ ...exam, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (e) => {
    setNewQ({ ...newQ, [e.target.name]: e.target.value });
  };

  const addQuestion = () => {
    if (!newQ.text.trim()) return alert("Enter question text!");

    setQuestions([
      ...questions,
      {
        text: newQ.text,
        options: [newQ.optionA, newQ.optionB, newQ.optionC, newQ.optionD],
        correct_option_index: parseInt(newQ.correct_option),
        marks: parseFloat(newQ.marks),
      },
    ]);

    setNewQ({
      text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correct_option: 0,
      marks: 1,
    });
  };

  const submitExam = async () => {
    try {
      console.log("Submitting exam:", exam, questions);
      const payload = { ...exam, questions };

      const res = await apiFetch("/admin/create-exam", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("Exam created successfully!");
      nav("/admin");
    } catch (err) {
      console.error(err);
      alert("Failed to create exam");
    }
  };

  return (
    <div className="create-exam-page">
      <h1>Create New Exam</h1>

      {/* Exam Form */}
      <div className="exam-form">
        <input
          type="text"
          name="name"
          placeholder="Exam Name"
          value={exam.name}
          onChange={handleExamChange}
        />

        <textarea
          name="description"
          placeholder="Exam Description"
          value={exam.description}
          onChange={handleExamChange}
        />

        <input
          type="number"
          name="duration_minutes"
          placeholder="Duration (minutes)"
          value={exam.duration_minutes}
          onChange={handleExamChange}
        />

        <input
          type="number"
          name="total_marks"
          placeholder="Total Marks"
          value={exam.total_marks}
          onChange={handleExamChange}
        />

        <select
          name="question_source_type"
          value={exam.question_source_type}
          onChange={handleExamChange}
        >
          <option value="MANUAL">Manual</option>
          <option value="AI">AI Generated</option>
        </select>
      </div>

      <h2>Add Questions</h2>

      <div className="question-form">
        <input
          type="text"
          name="text"
          placeholder="Question Text"
          value={newQ.text}
          onChange={handleQuestionChange}
        />

        <input
          type="text"
          name="optionA"
          placeholder="Option A"
          value={newQ.optionA}
          onChange={handleQuestionChange}
        />

        <input
          type="text"
          name="optionB"
          placeholder="Option B"
          value={newQ.optionB}
          onChange={handleQuestionChange}
        />

        <input
          type="text"
          name="optionC"
          placeholder="Option C"
          value={newQ.optionC}
          onChange={handleQuestionChange}
        />

        <input
          type="text"
          name="optionD"
          placeholder="Option D"
          value={newQ.optionD}
          onChange={handleQuestionChange}
        />

        <select
          name="correct_option"
          value={newQ.correct_option}
          onChange={handleQuestionChange}
        >
          <option value="0">Option A</option>
          <option value="1">Option B</option>
          <option value="2">Option C</option>
          <option value="3">Option D</option>
        </select>

        <input
          type="number"
          name="marks"
          placeholder="Marks"
          value={newQ.marks}
          onChange={handleQuestionChange}
        />

        <button className="add-btn" onClick={addQuestion}>➕ Add Question</button>
      </div>

      <h3>Total Questions: {questions.length}</h3>

      <button className="submit-btn" onClick={submitExam}>
        ✅ Create Exam
      </button>
    </div>
  );
}
