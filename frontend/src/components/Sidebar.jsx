import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import "./Sidebar.css";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const candidateMenu = [
    { label: "Dashboard", path: "/candidate" },
    { label: "My Results", path: "/candidate/results" },
    { label: "Certificates", path: "/candidate/candidateCertificates" },
  ];

  const adminMenu = [
    { label: "Admin Dashboard", path: "/admin" },
    { label: "Live Proctoring", path: "/admin/proctoring" },
  ];

  const menu = user?.role === "ADMIN" ? adminMenu : candidateMenu;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Menu</h2>
      </div>

      <ul className="sidebar-menu">
        {menu.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
