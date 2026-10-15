import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Award, Globe, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    location: user?.location || "Punjab, India",
    experienceYears: user?.experienceYears || 5,
    preferredLanguage: user?.preferredLanguage || "English",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await API.put("/auth/profile", formData);
      if (res.data.success) {
        updateUser(res.data.user);
        setMessage("Farmer profile successfully updated.");
      }
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Profile Header Banner */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          padding: "28px",
          marginBottom: "24px",
          background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "var(--primary)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
            fontWeight: 800,
            boxShadow: "0 8px 16px rgba(21, 128, 61, 0.3)",
          }}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : "R"}
        </div>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {user?.name || "Ramesh Patel"}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Registered Agricultural Operator • {user?.location || "Punjab, India"}
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <span
              style={{
                fontSize: "0.78rem",
                background: "#ffffff",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-color)",
                fontWeight: 600,
              }}
            >
              {user?.experienceYears || 5} Years Experience
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                background: "#ffffff",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-color)",
                fontWeight: 600,
              }}
            >
              Language: {user?.preferredLanguage || "English"}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.88rem",
          }}
        >
          <CheckCircle2 size={18} /> {message}
        </div>
      )}

      {/* Profile Form */}
      <div className="card">
        <h3 style={{ fontSize: "1.1rem", marginBottom: "18px" }}>Farmer Profile Information</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Registered Account)</label>
            <input
              type="email"
              className="form-input"
              value={user?.email || ""}
              disabled
              style={{ background: "var(--bg-subtle)", cursor: "not-allowed" }}
            />
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Email is uniquely tied to your farm telemetry database.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Mobile Phone</label>
              <input
                type="text"
                name="phone"
                className="form-input"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Farming Region / State</label>
              <input
                type="text"
                name="location"
                className="form-input"
                placeholder="e.g. Punjab, India"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Farming Experience (Years)</label>
              <input
                type="number"
                name="experienceYears"
                min="0"
                className="form-input"
                value={formData.experienceYears}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Platform Language</label>
              <select
                name="preferredLanguage"
                className="form-select"
                value={formData.preferredLanguage}
                onChange={handleChange}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Marathi">Marathi (मराठी)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

