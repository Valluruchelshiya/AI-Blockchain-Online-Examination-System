import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./CertificatesPage.css";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [completedAttempts, setCompletedAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load completed exam attempts
  const loadCompletedAttempts = async () => {
    try {
      const data = await apiFetch("/certificates/completed-attempts");
      setCompletedAttempts(data || []);
    } catch (err) {
      console.error("Failed to load completed attempts", err);
      setError("Unable to load completed attempts");
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError("");
      await Promise.all([loadCompletedAttempts()]);
      setLoading(false);
    };

    loadAll();
  }, []);

  const downloadCertificate = async (certificateId) => {
    try {
      const blob = await apiFetch(`/certificates/download/${certificateId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "certificate.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download certificate");
    }
  };

  const issueCertificate = async (attemptId) => {
    try {
      const res = await apiFetch(`/certificates/issue/${attemptId}`, {
        method: "POST",
      });
      alert(res.message || "Certificate issued successfully");
      // Refresh both lists
      await Promise.all([loadCompletedAttempts()]);
    } catch (err) {
      console.error("Failed to issue certificate", err);
      alert(err?.message || "Failed to issue certificate");
    }
  };

  if (loading) {
    return <div className="certificates-page">Loading certificates...</div>;
  }

  return (
    <div className="certificates-page">
      {/* Completed Attempts */}
      <section className="section">
        <h3>Completed Exams</h3>
        {completedAttempts.length === 0 ? (
          <p>No completed exams found.</p>
        ) : (
          <table className="table" border={1}>
            <thead>
              <tr>
                <th>Exam</th>
                <th>Candidate</th>
                <th>Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {completedAttempts.map((attempt) => (
                <tr key={attempt.attempt_id}>
                  <td>{attempt.exam_name}</td>
                  <td>{attempt.user_name}</td>
                  <td>{attempt.score}</td>
                  <td>PASSED</td>
                  <td>
                    <button
                      className="btn"
                      onClick={() => issueCertificate(attempt.attempt_id)}
                    >
                      Issue Certificate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Certificates */}
      <section className="section">
        <h3>Issued Certificates</h3>
        {certificates.length === 0 ? (
          <p>No certificates issued yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Issued On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id}>
                  <td>{cert.exam_name}</td>
                  <td>{new Date(cert.issued_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn"
                      onClick={() => downloadCertificate(cert.id)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
