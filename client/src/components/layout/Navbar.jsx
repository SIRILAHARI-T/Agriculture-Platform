import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Sun, CloudRain, Bell, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const PAGE_TITLES = {
  "/": {
    title: "Farm Dashboard",
    subtitle: "View your farm information and daily activities",
  },
  "/farms": {
    title: "My Farms",
    subtitle: "View your farms, locations, boundaries, and soil information",
  },
  "/crops": {
    title: "My Crops",
    subtitle: "Track crop growth, planting, and harvest dates",
  },
  "/weather": {
    title: "Farm Weather",
    subtitle: "Current weather, 7-day forecast, and spraying advice",
  },
  "/health": {
    title: "Crop Health",
    subtitle: "Check crop problems, diseases, and treatment advice",
  },
  "/irrigation": {
    title: "Smart Irrigation",
    subtitle: "Plan watering based on crop needs and expected rainfall",
  },
  "/market": {
    title: "Market Prices",
    subtitle: "View crop prices, price changes, and selling advice",
  },
  "/recommendations": {
    title: "Smart Recommendations",
    subtitle: "Helpful advice based on your farm information",
  },
  "/profile": {
    title: "My Profile",
    subtitle: "View and manage your personal and farm information",
  },
};

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const currentMeta = PAGE_TITLES[location.pathname] || {
    title: "AgriSmart AI Platform",
    subtitle: "Digital farming information and tools",
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="mobile-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={24} />
        </button>
        <div className="page-title-group">
          <h1>{currentMeta.title}</h1>
          <p>{currentMeta.subtitle}</p>
        </div>
      </div>

      <div className="navbar-right">
        {/* Quick Weather Pill */}
        <div className="weather-chip">
          <Sun size={18} color="#d97706" />
          <span>29°C</span>
          <span style={{ color: "var(--text-light)" }}>|</span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Sunny & Mild
          </span>
        </div>

        {/* Notifications */}
        <Link
          to="/recommendations"
          className="btn-icon"
          title="Smart Recommendations"
        >
          <Bell size={19} />
          <span className="badge-dot"></span>
        </Link>

        {/* User avatar link */}
        <Link
          to="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 12px 5px 6px",
            borderRadius: "var(--radius-full)",
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-xs)",
            transition: "all var(--transition-fast)",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--primary)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "F"}
          </div>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {user?.name?.split(" ")[0] || "Farmer"}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
