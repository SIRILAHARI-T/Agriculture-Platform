import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Lock, Mail, User, MapPin, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "Punjab, India",
    experienceYears: 5,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Front-end validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await register(formData);
      if (res.success) {
        setSuccessMsg("Account created! Redirecting to your dashboard...");
        setTimeout(() => navigate("/"), 1500);
      } else {
        setError(res.message || "Registration failed. Please review your details.");
      }
    } finally {
      setSubmitting(false);
    }
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
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "var(--radius-lg)",
          padding: "40px 36px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #15803d, #22c55e)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              marginBottom: "12px",
            }}
          >
            <Sprout size={28} />
          </div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
            Farmer Registration
          </h1>
          <p style={{ fontSize: "0.84rem", color: "#64748b", marginTop: "4px" }}>
            Join AgriSmart AI to empower your agricultural decisions
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

        {successMsg && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "18px",
              fontWeight: 600,
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: "relative" }}>
              <User
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
                type="text"
                name="name"
                className="form-input"
                style={{ paddingLeft: "38px" }}
                placeholder="Ramesh Patel"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

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
                name="email"
                className="form-input"
                style={{ paddingLeft: "38px" }}
                placeholder="farmer@domain.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password (min 6 characters)</label>
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
                name="password"
                className="form-input"
                style={{ paddingLeft: "38px" }}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Location / Region</label>
              <input
                type="text"
                name="location"
                className="form-input"
                placeholder="State, District"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Farming Exp (Years)</label>
              <input
                type="number"
                name="experienceYears"
                className="form-input"
                min="0"
                value={formData.experienceYears}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "8px" }}
            disabled={submitting}
          >
            {submitting ? "Creating Account..." : "Complete Registration"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "0.86rem",
            color: "#64748b",
          }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

