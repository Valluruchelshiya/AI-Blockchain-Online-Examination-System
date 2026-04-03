import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import Button from "../components/Button";
import Input from "../components/Input";
import Alert from "../components/Alert";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await login(form.email, form.password);
      console.log("Login response:", response);

      // 🔥 HANDLE BOTH POSSIBLE RETURNS
      // Case 1: login() returns full API response
      // Case 2: login() returns only user object
      const user = response.user ? response.user : response;

      console.log("Logged in user:", user);

      if (!user || !user.role) {
        throw new Error("Role not found. Login failed.");
      }

      // ✅ ROLE-BASED NAVIGATION (TRUST BACKEND)
      if (user.role === "ADMIN") {
        nav("/admin");
      } else if (user.role === "CANDIDATE") {
        sessionStorage.setItem("candidate_id", user.id);
        nav("/candidate");
      } else {
        setError("Unauthorized role");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign in</h1>

        {error && <Alert type="danger">{error}</Alert>}

        <form onSubmit={onSubmit} className="auth-form">
          <Input
            htmlFor="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={onChange}
            required
          />

          <Input
            htmlFor="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={onChange}
            required
          />

          <Button type="submit" fullWidth>
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
