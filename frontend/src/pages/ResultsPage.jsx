import React, { useEffect, useState } from "react";
import "./ResultsPage.css";
import { apiFetch } from "../api";

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await apiFetch("/results");
        setResults(data);
      } catch (err) {
        console.error("Failed to load results", err);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  if (loading) {
    return <div className="loading-text">Loading results...</div>;
  }

  return (
    <div className="results-page">
      <h1 className="page-title">My Exam Results</h1>

      {results.length === 0 && (
        <p className="empty-message">No exam results available yet.</p>
      )}

      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Score</th>
              <th>Percentile</th>
              <th>Status</th>
              <th>Date</th>
              <th>View</th>
            </tr>
          </thead>

          <tbody>
            {results.map((r) => (
              <tr key={r.attempt_id}>
                <td>{r.exam_name}</td>
                <td>{r.score}</td>
                <td>{r.percentile}%</td>

                <td>
                  <span className={`status-badge ${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                </td>

                <td>{r.completed_at}</td>

                <td>
                  <button
                    className="view-btn"
                    onClick={() => alert("Detailed view coming soon!")}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
