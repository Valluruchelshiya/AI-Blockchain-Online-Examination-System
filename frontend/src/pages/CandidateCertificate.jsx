import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./CertificatesPage.css";

export default function CandidateCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load certificates for logged-in user
  const loadMyCertificates = async () => {
  try {
    const userId = sessionStorage.getItem("candidate_id");

    const data = await apiFetch(`/certificates/my?user_id=${userId}`);
    setCertificates(data || []);
  } catch (err) {
    console.error("Failed to load certificates", err);
    setError("Unable to load certificates");
  }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      await loadMyCertificates();
      setLoading(false);
    };
    loadData();
  }, []);

  const downloadCertificate = async (certificateId) => {
    try {
      const blob = 
      await apiFetch(`/certificates/download/${certificateId}`, { responseType: "blob" })
      ;
      // Add validation to ensure blob is valid
      if (!blob || blob.size === 0) {
        throw new Error("Invalid certificate file");
      }
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

  if (loading) {
    return <div className="certificates-page">Loading certificates...</div>;
  }

  return (
    <div className="certificates-page">
      <h3>My Certificates</h3>

      {error && <p className="error">{error}</p>}

      {certificates.length === 0 ? (
        <p>No certificates issued yet.</p>
      ) : (
        <table className="table" border={1}>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Status</th>
              <th>Issued On</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => (
              <tr key={cert.id}>
                <td>{cert.exam_name}</td>
                <td>{cert.result_status}</td>
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
    </div>
  );
}
