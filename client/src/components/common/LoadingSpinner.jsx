import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ message = "Loading agricultural data..." }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "260px",
        gap: "14px",
        color: "var(--text-muted)",
      }}
    >
      <Loader2
        size={36}
        style={{
          animation: "spin 1s linear infinite",
          color: "var(--primary)",
        }}
      />
      <p style={{ fontSize: "0.9rem", fontWeight: 500 }}>{message}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

