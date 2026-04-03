import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./ScheduledExams.css";

export default function ScheduledExams() {
  const [exams, setExams] = useState([]);

  // Load all exams
  const loadExams = async () => {
    try {
      const data = await apiFetch("/exams/get-drafts");
      setExams(data);
      console.log("Scheduled Exams data:", data);
    } catch (err) {
      console.error("Failed to load exams", err);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Update Status
  const toggleStatus = async (examId, newStatus) => {
    try {
      await apiFetch("/admin/schedule", {
        method: "PUT",
        body: JSON.stringify({
          exam_id: examId,
          status: newStatus,
        }),
      });

      // Update list instantly
      setExams(exams.map(exam =>
        exam.id === examId ? { ...exam, status: newStatus } : exam
      ));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Error updating exam status");
    }
  };

  const toggleStatusDeactivate = async (examId, newStatus) => {
    try {
      await apiFetch("/admin/schedule", {
        method: "PUT",
        body: JSON.stringify({
          exam_id: examId,
          status: newStatus,
        }),
      });

      // Update list instantly
      setExams(exams.map(exam =>
        exam.id === examId ? { ...exam, status: newStatus } : exam
      ));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Error updating exam status");
    }
  };

  return (
    <div className="scheduled-page">
      <h1>Scheduled Exams</h1>

      {exams.length === 0 ? (
        <p className="empty">No exams available</p>
      ) : (
        <table className="exam-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Exam Name</th>
              <th>Status</th>
              <th>Activate</th>
              <th>Deactivate</th>
            </tr>
          </thead>

          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.id}</td>
                <td>{exam.name}</td>
                <td className={exam.status === "ACTIVE" ? "active" : "draft"}>
                  {exam.status}
                </td>

                <td>
                  <input
                    type="checkbox"
                    checked={exam.status === "ACTIVE"}
                    onChange={(e) =>
                      toggleStatus(
                        exam.id,
                        e.target.checked ? "ACTIVE" : "DRAFT"
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={exam.status === "DRAFT"}
                    onChange={(e) =>
                      toggleStatusDeactivate(
                        exam.id,
                        e.target.checked ? "ACTIVE" : "DRAFT"
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
