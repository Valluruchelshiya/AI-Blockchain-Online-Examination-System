import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          Online Exam System
        </Link>
      </div>

      <div className="navbar-right">
        {!user && (
          <>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/register" className="nav-link">
              Register
            </Link>
          </>
        )}

        {user && user.role === "CANDIDATE" && (
          <>
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/results" className="nav-link">Results</Link>
            <Link to="/candidateCertificates" className="nav-link">Certificates</Link>
          </>
        )}

        {user && user.role === "ADMIN" && (
          <>
            <Link to="/admin" className="nav-link">Admin Dashboard</Link>
            <Link to="/admin/proctoring" className="nav-link">Proctoring</Link>
          </>
        )}

        {user && (
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
