import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Sprout,
  CloudSun,
  ShieldAlert,
  Droplets,
  TrendingUp,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon">
          <Sprout size={22} />
        </div>
        <div>
          <div className="brand-name">AgriSmart AI</div>
        </div>
        <div className="brand-badge">PRO</div>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        <div className="nav-category">Main Operations</div>
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onClose}
          end
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/farms"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <MapPin size={19} />
          <span>GIS Farms</span>
        </NavLink>
        <NavLink
          to="/crops"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <Sprout size={19} />
          <span>Crop Management</span>
        </NavLink>

        <div className="nav-category">Agronomic Intelligence</div>
        <NavLink
          to="/weather"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <CloudSun size={19} />
          <span>Weather & Climate</span>
        </NavLink>
        <NavLink
          to="/health"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <ShieldAlert size={19} />
          <span>Crop Health & Pests</span>
        </NavLink>
        <NavLink
          to="/irrigation"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <Droplets size={19} />
          <span>Smart Irrigation</span>
        </NavLink>
        <NavLink
          to="/market"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <TrendingUp size={19} />
          <span>Market Trends</span>
        </NavLink>
        <NavLink
          to="/recommendations"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <Sparkles size={19} />
          <span>AI Recommendations</span>
        </NavLink>

        <div className="nav-category">Account</div>
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <User size={19} />
          <span>Farmer Profile</span>
        </NavLink>
      </nav>

      {/* Footer Profile & Logout */}
      <div className="sidebar-footer">
        <div className="user-mini">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "R"}
          </div>
          <div className="user-info-text">
            <div className="user-name-text">{user?.name || "Ramesh Patel"}</div>
            <div className="user-role-text">{user?.location || "Punjab, India"}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn-icon"
          title="Sign Out"
          style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.22)", color: "#fca5a5" }}
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

