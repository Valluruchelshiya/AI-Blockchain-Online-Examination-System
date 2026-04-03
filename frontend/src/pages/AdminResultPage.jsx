import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./AdminResultPage.css";

export default function AdminResultPage() {
  const [results, setResults] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [scoreFilter, setScoreFilter] = useState("");
  const [percentileFilter, setPercentileFilter] = useState("");

  const [selectedCandidates, setSelectedCandidates] = useState([]);

  useEffect(() => {
    apiFetch("/admin/results")
      .then((data) => {
        setResults(data);
        setFiltered(data);
      })
      .catch(console.error);
  }, []);

  const applyFilter = () => {
    let data = [...results];

    if (scoreFilter.trim() !== "") {
      data = data.filter((r) => r.score >= Number(scoreFilter));
    }

    if (percentileFilter.trim() !== "") {
      data = data.filter((r) => r.percentile >= Number(percentileFilter));
    }

    setFiltered(data);
  };

  const toggleSelect = (attemptId) => {
    setSelectedCandidates((prev) =>
      prev.includes(attemptId)
        ? prev.filter((id) => id !== attemptId)
        : [...prev, attemptId]
    );
  };

  const handleSendMail = async () => {
    const selected = filtered.filter((r) =>
      selectedCandidates.includes(r.attempt_id)
    );
    const rejected = filtered.filter(
      (r) => !selectedCandidates.includes(r.attempt_id)
    );

    await apiFetch("/admin/results/notify", {
      method: "POST",
      body: JSON.stringify({ selected, rejected }),
    });

    alert("Emails sent successfully!");
  };

  return (
    <div className="admin-results-page">
      <h2>Exam Results</h2>

      <div className="filter-box">
        <input
          type="number"
          placeholder="Min Score"
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
        />

        <input
          type="number"
          placeholder="Min Percentile"
          value={percentileFilter}
          onChange={(e) => setPercentileFilter(e.target.value)}
        />

        <button className="btn" onClick={applyFilter}>
          Apply Filters
        </button>
      </div>

      <table className="results-table">
        <thead>
          <tr>
            <th>Select</th>
            <th>Candidate</th>
            <th>Email</th>
            <th>Exam</th>
            <th>Score</th>
            <th>Percentile</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((r) => (
            <tr key={r.attempt_id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(r.attempt_id)}
                  onChange={() => toggleSelect(r.attempt_id)}
                />
              </td>
              <td>{r.candidate_name}</td>
              <td>{r.email}</td>
              <td>{r.exam_name}</td>
              <td>{r.score}</td>
              <td>{r.percentile}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn send-btn" onClick={handleSendMail}>
        Send Selection & Rejection Emails
      </button>
    </div>
  );
}
