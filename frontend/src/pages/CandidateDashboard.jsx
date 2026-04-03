import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";

export default function CandidateDashboard() {
  const [exams, setExams] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    apiFetch("/exams")
      .then(setExams)
      .catch((err) => console.error(err));
  }, []);

  const launchAdvancedPortal = () => {
    // Option 1: Open in new tab
    window.open("http://192.168.29.85:8501", "_blank");

    // Option 2: Open in same tab
    // window.location.href = "http://192.168.29.85:8501";
  };

  return (
    <div>
      <h2>Available Exams</h2>

      {/* Launch Advanced Portal Button */}
      <div style={{ marginBottom: "20px" }}>
        <Button onClick={launchAdvancedPortal}>
          Launch Advanced Portal
        </Button>
      </div>

      <div className="card-grid">
        {exams.map((e) => (
          <Card key={e.id}>
            <h3>{e.name}</h3>
            <p>{e.description}</p>
            <p>Duration: {e.duration_minutes} minutes</p>

            <Button onClick={() => nav(`/candidate/exams/${e.id}/instructions`)}>
              View Instructions
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
