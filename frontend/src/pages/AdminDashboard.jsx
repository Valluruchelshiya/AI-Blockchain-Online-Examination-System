import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { apiFetch } from "../api";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();          // logged-in admin details
  const nav = useNavigate();

  const [stats, setStats] = useState({
    totalExams: 0,
    totalCandidates: 0,
    completedAttempts: 0,
    cheatingIncidents: 0,
    activeProctoring: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await apiFetch("/admin/dashboard-stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      }
    };

    const loadRecent = async () => {
      try {
        const logs = await apiFetch("/admin/recent-activities");
        setRecentActivities(logs);
      } catch (err) {
        console.error("Failed to load recent activities", err);
      }
    };

    loadStats();
    loadRecent();
  }, []);

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Admin Dashboard</h1>

      {/* Logged-In Admin Info */}
      <div className="admin-info-card">
        <h2>Welcome, {user?.name}</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Mobile Number:</strong> {user?.mobile_number}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>User ID:</strong> {user?.id}</p>
      </div>

      {/* Dashboard Stats */}
      <div className="stats-grid">
        <div className="stat-card"><h2>{stats.totalExams}</h2><p>Total Exams</p></div>
        <div className="stat-card"><h2>{stats.totalCandidates}</h2><p>Total Candidates</p></div>
        <div className="stat-card"><h2>{stats.completedAttempts}</h2><p>Completed Attempts</p></div>
        <div className="stat-card"><h2>{stats.cheatingIncidents}</h2><p>Cheating Incidents</p></div>
        <div className="stat-card"><h2>{stats.activeProctoring}</h2><p>Active Proctoring</p></div>
      </div>

      {/* Admin Action Panel */}
      <div className="admin-actions">
        <h2>Admin Actions</h2>

        <div className="action-grid">
          <button className="action-btn" onClick={() => nav("/admin/create-exam")}>
            ➕ Create New Exam
          </button>

          <button className="action-btn" onClick={() => nav("/admin/ai-exam")}>
            🧠 Generate AI Exam
          </button>

          <button className="action-btn" onClick={() => nav("/admin/question-bank")}>
            📝 Manage Question Bank
          </button>

          <button className="action-btn" onClick={() => nav("/admin/schedule")}>
            📅 Schedule Exams
          </button>

          <button className="action-btn" onClick={() => nav("/admin/results")}>
            📊 View Results
          </button>

          <button className="action-btn" onClick={() => nav("/admin/proctoring")}>
            👁️ Proctor Live Exams
          </button>

          <button className="action-btn" onClick={() => nav("/admin/cheating")}>
            🚨 Cheating Logs
          </button>

          <button className="action-btn" onClick={() => nav("/admin/certificates")}>
            📄 Certificates
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="recent-activity">
        <h2>Recent Activities</h2>

        {recentActivities.length === 0 && (
          <p className="empty-message">No recent activities.</p>
        )}

        <ul>
          {recentActivities.map((item) => (
            <li key={item.id} className="activity-item">
              <span className="activity-type">{item.type}</span>
              <span className="activity-detail">{item.detail}</span>
              <span className="activity-time">{item.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
