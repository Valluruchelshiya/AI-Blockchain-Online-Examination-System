import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import "./Layouts.css";

export default function AdminLayout() {
  return (
    <>
      <Navbar />

      <div className="layout-container">
        <Sidebar />

        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
