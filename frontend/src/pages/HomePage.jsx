import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // update path if needed

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logo} alt="App Logo" style={styles.logo} />

        <h1 style={styles.title}>Online Examination Platform</h1>
        <p style={styles.subtitle}>
          Secure • Smart • AI-Proctored Exams
        </p>

        <div style={styles.buttonGroup}>
          <button
            style={styles.loginBtn}
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            style={styles.registerBtn}
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1e3c72, #2a5298)",
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    width: "400px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  logo: {
    width: "120px",
    height: "120px",
    objectFit: "contain",
    marginBottom: "20px",
  },
  title: {
    margin: "10px 0",
  },
  subtitle: {
    color: "#666",
    marginBottom: "30px",
  },
  buttonGroup: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
  },
  loginBtn: {
    padding: "10px 25px",
    background: "#1e3c72",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  registerBtn: {
    padding: "10px 25px",
    background: "#2a5298",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
