import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import CandidateDashboard from "./pages/CandidateDashboard.jsx";
import ExamInstructions from "./pages/ExamInstructions.jsx";
import ExamPlayer from "./pages/ExamPlayer.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import CertificatesPage from "./pages/CertificatesPage.jsx";
import CandidateCertificatesPage from "./pages/CandidateCertificate.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminProctoring from "./pages/AdminProctoring.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import CreateExam from "./pages/CreateExam.jsx";
import ScheduledExams from "./pages/ScheduledExams.jsx";
import AdminResultPage from "./pages/AdminResultPage.jsx";
import AdminCheatingLogs from "./pages/AdminCheatingLogs.jsx";
import HomePage from "./pages/HomePage.jsx";

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route  path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/candidate"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<CandidateDashboard />} />
          <Route path="exams/:examId/instructions" element={<ExamInstructions />} />
          <Route path="exams/:examId/attempt/:attemptId" element={<ExamPlayer />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="candidateCertificates" element={<CandidateCertificatesPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <PrivateRoute roles={["ADMIN"]}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="create-exam" element={<CreateExam />} />
          <Route path="schedule" element={<ScheduledExams />} />
          <Route path="results" element={<AdminResultPage />} />
          <Route path="proctoring" element={<AdminProctoring />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="cheating" element={<AdminCheatingLogs />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
