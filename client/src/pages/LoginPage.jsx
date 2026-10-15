import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Lock, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate("/");
      } else {
        setError(res.message || "Failed to log in. Please check your credentials.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("farmer@smartagri.com");
    setPassword("Farmer@123");
    setError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 15% 15%, rgba(34, 197, 94, 0.12) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.08) 0%, transparent 45%), linear-gradient(145deg, #07170f 0%, #0d2818 55%, #05140b 100%)",
        padding: "24px 20px",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#ffffff",
          borderRadius: "var(--radius-lg)",
          padding: "40px 36px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #15803d, #22c55e)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              marginBottom: "14px",
              boxShadow: "0 8px 16px rgba(21, 128, 61, 0.3)",
            }}
          >
            <Sprout size={32} />
          </div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a" }}>
            AgriSmart AI
          </h1>
          <p style={{ fontSize: "0.86rem", color: "#64748b", marginTop: "4px" }}>
            Intelligent Farming & Recommendation System
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "18px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: "38px" }}
                placeholder="farmer@smartagri.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: "38px" }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "6px" }}
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In to Platform"} <ArrowRight size={17} />
          </button>
        </form>

        {/* Demo Credentials Quick Button */}
        <div style={{ marginTop: "18px", textAlign: "center" }}>
          <button
            type="button"
            onClick={handleDemoFill}
            style={{
              background: "var(--success-bg)",
              border: "1px solid var(--success-border)",
              color: "var(--success-text)",
              padding: "9px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "var(--shadow-xs)",
              transition: "all var(--transition-fast)",
            }}
          >
            <CheckCircle size={15} /> Use Demo Credentials (farmer@smartagri.com)
          </button>
        </div>

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "0.86rem",
            color: "#64748b",
          }}
        >
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)", fontWeight: 700 }}>
            Register Farmer Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

