import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "./RegisterPage.css";

export default function RegisterPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile_number: "",
    password: "",
    role: "",
    image_base: "",   // ✅ Added image field
  });

  const [preview, setPreview] = useState(null); // For showing preview
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result); // show preview
      setForm({
        ...form,
        image_base: reader.result, // store Base64 string
      });
    };

    reader.readAsDataURL(file); // convert to Base64
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      console.log("Submitting registration form:", form);

      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setSuccess("Registration successful. Redirecting to login...");
      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>

        {error && <Alert type="danger">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <form onSubmit={onSubmit} className="auth-form">
          <Input
            label="Full Name"
            name="name"
            type="text"
            value={form.name}
            onChange={onChange}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
          />

          <Input
            label="Mobile Number"
            name="mobile_number"
            type="text"
            value={form.mobile_number}
            onChange={onChange}
            required
          />

          <label className="role-label">Select Role</label>
          <select
            name="role"
            value={form.role}
            onChange={onChange}
            className="role-select"
            required
          >
            <option value="" disabled>Select Role</option>
            <option value="CANDIDATE">Candidate</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* ✅ Image Upload Field */}
          <label className="image-label">Upload Profile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            required
          />

          {/* ✅ Preview Image */}
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{ width: "120px", marginTop: "10px", borderRadius: "8px" }}
            />
          )}

          <Button type="submit" fullWidth>
            Register
          </Button>
        </form>
      </div>
    </div>
  );
}
