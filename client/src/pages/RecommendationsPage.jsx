import React, { useState, useEffect } from "react";
import { Sparkles, Filter, CheckCircle2, AlertCircle, ArrowRight, Zap } from "lucide-react";
import API from "../services/api";
import AlertBadge from "../components/common/AlertBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";

const CATEGORIES = ["All", "Weather", "Crop Health", "Irrigation", "Fertilization", "Harvest", "Market"];
const PRIORITIES = ["All", "High", "Medium", "Low"];

const RecommendationsPage = () => {
  const [data, setData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await API.get("/recommendations");
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <LoadingSpinner message="Synthesizing weather, soil, phenology, and market models..." />;
  }

  const allRecs = data?.recommendations || [];

  const filteredRecs = allRecs.filter((r) => {
    const matchCat = selectedCategory === "All" || r.category === selectedCategory;
    const matchPri = selectedPriority === "All" || r.priority === selectedPriority;
    return matchCat && matchPri;
  });

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={24} color="var(--primary)" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              AI Agricultural Recommendations Engine
            </h2>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Extensible expert rule engine cross-referencing micro-climate, soil chemistry, stage Kc, and mandi prices
          </p>
        </div>

        {/* Priority Summary Pills */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: "0.82rem",
              fontWeight: 700,
            }}
          >
            {data?.highPriorityCount || 0} Urgent Action Items
          </div>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              fontSize: "0.82rem",
              fontWeight: 700,
            }}
          >
            {allRecs.length} Total Synthesized Insights
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: "14px 18px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)" }}>
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${selectedCategory === cat ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)" }}>
            Priority:
          </span>
          {PRIORITIES.map((pri) => (
            <button
              key={pri}
              className={`btn btn-sm ${selectedPriority === pri ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedPriority(pri)}
            >
              {pri}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filteredRecs.map((rec) => (
          <div key={rec.id} className={`rec-card rec-priority-${rec.priority}`}>
            <div className="rec-header">
              <div>
                <h3 className="rec-title">{rec.title}</h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  <AlertBadge priority={rec.priority} text={`Priority: ${rec.priority}`} />
                  <AlertBadge text={rec.category} />
                  {rec.cropName && (
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Target Crop: <strong>{rec.cropName}</strong>
                    </span>
                  )}
                  {rec.farmName && (
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Plot: <strong>{rec.farmName}</strong>
                    </span>
                  )}
                </div>
              </div>

              {rec.impact && (
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "var(--primary)",
                    background: "var(--primary-light)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--primary-border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  ★ {rec.impact}
                </span>
              )}
            </div>

            <p className="rec-desc">{rec.description}</p>

            <div className="rec-action-box">
              <Zap size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Recommended Field Action: </strong>
                <span>{rec.action}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredRecs.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No recommendations match the selected filters.
            </p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedPriority("All");
              }}
              style={{ marginTop: "12px" }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;

