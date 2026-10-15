import React from "react";

const StatCard = ({ label, value, subtext, icon: Icon, theme = "green", trend = null }) => {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-info-label">{label}</div>
        <div className="stat-info-value">{value}</div>
        {subtext && (
          <div className="stat-info-sub">
            {trend === "up" && (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", background: "var(--success-bg)", color: "var(--success)", border: "1px solid var(--success-border)", fontSize: "0.75rem", fontWeight: 800 }}>
                ↑
              </span>
            )}
            {trend === "down" && (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger-border)", fontSize: "0.75rem", fontWeight: 800 }}>
                ↓
              </span>
            )}
            <span>{subtext}</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className={`stat-icon-wrapper stat-icon-${theme}`}>
          <Icon size={26} />
        </div>
      )}
    </div>
  );
};

export default StatCard;

