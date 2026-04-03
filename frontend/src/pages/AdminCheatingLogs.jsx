import React, { useEffect, useState } from "react";
import "./AdminCheatingLogs.css";
import { apiFetch } from "../api";

export default function AdminCheatingLogs() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [examId, setExamId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Load all logs initially
  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, []);

  // 🔹 Fetch logs with optional filters
  const fetchLogs = async () => {
  setLoading(true);
  setError("");

  try {
    let query = "";
    if (examId) query += `exam_id=${examId}&`;
    if (studentId) query += `user_id=${studentId}&`;

    const data = await apiFetch(
      `/admin/cheating${query ? `?${query}` : ""}`
    );

    // ✅ CORRECT HANDLING
    console.warn("Cheating logs response:", data);
    if (data && Array.isArray(data.logs)) {
      setLogs(data.logs);
    } else {
      console.warn("Unexpected cheating logs response:", data);
      setLogs([]);
    }

  } catch (err) {
    console.error(err);
    setError("Failed to load cheating logs");
    setLogs([]);
  } finally {
    setLoading(false);
  }
};


  // 🔹 Fetch severity summary
  const fetchSummary = async () => {
    try {
      const data = await apiFetch("/admin/cheating/summary");
      setSummary(data);
    } catch (err) {
      console.error("Failed to load summary");
    }
  };

  const clearFilters = () => {
    setExamId("");
    setStudentId("");
    fetchLogs();
  };

  return (
    <div className="cheating-logs-page">
      <h1 className="page-title">🚨 Cheating Logs</h1>

      {/* ================= Summary ================= */}
      <div className="summary-cards">
        {Object.keys(summary).length === 0 && (
          <p className="empty">No summary data</p>
        )}

        {Object.entries(summary).map(([severity, count]) => (
          <div key={severity} className={`summary-card ${severity.toLowerCase()}`}>
            <h3>{severity}</h3>
            <p>{count}</p>
          </div>
        ))}
      </div>

      {/* ================= Filters ================= */}
      <div className="filter-panel">
        <input
          type="number"
          placeholder="Exam ID"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
        />

        <input
          type="number"
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />

        <button onClick={fetchLogs}>Apply Filters</button>
        <button className="clear-btn" onClick={clearFilters}>
          Clear
        </button>
      </div>

      {/* ================= Error ================= */}
      {error && <p className="error">{error}</p>}

      {/* ================= Table ================= */}
      <div className="table-wrapper">
        {loading ? (
          <p className="loading">Loading cheating logs...</p>
        ) : logs.length === 0 ? (
          <p className="empty">No cheating incidents found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Exam</th>
                <th>Student</th>
                <th>Rule</th>
                <th>Severity</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.incident_id}>
                  <td>{log.incident_id}</td>
                  <td>
                    {log.exam_name} <br />
                    <small>ID: {log.exam_id}</small>
                  </td>
                  <td>
                    {log.user_name} <br />
                    <small>ID: {log.user_id}</small>
                  </td>
                  <td>{log.event_type}</td> 
                  <td>
                    <span className={`severity ${log.severity.toLowerCase()}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
