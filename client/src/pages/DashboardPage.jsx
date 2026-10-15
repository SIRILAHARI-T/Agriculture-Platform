import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Sprout,
  Droplets,
  AlertTriangle,
  Sparkles,
  Sun,
  CloudRain,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Wind,
} from "lucide-react";
import API from "../services/api";
import StatCard from "../components/common/StatCard";
import AlertBadge from "../components/common/AlertBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import FarmMap from "../components/gis/FarmMap";


const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchDashboard();
  }, []);


  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await API.get("/dashboard");
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };


  if (loading) return <LoadingSpinner message="Loading your farm information..." />;
  if (error) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboard} style={{ marginTop: "16px" }}>
          Retry
        </button>
      </div>
    );
  }


  const { stats, weather, farms, crops, pendingSchedules, marketHighlights, recommendations } = data;


  return (
    <div>
      {/* KPI Stat Cards Row */}
      <div className="grid-4">
        <StatCard
          label="Total Farm Area"
          value={`${stats.totalAcreage} ac`}
          subtext={`${stats.totalFarms} mapped fields`}
          icon={MapPin}
          theme="green"
        />
        <StatCard
          label="My Crops"
          value={stats.totalCrops}
          subtext="Different crop growth stages"
          icon={Sprout}
          theme="blue"
        />
        <StatCard
          label="Today's Water Need"
          value={`${Math.round(stats.dailyWaterRequirementLiters / 1000)}k L`}
          subtext="Based on weather and crop water needs"
          icon={Droplets}
          theme="purple"
        />
        <StatCard
          label="Crop Health Problems"
          value={stats.activeHealthAlerts}
          subtext={stats.activeHealthAlerts === 0 ? "All crops look healthy" : "Needs attention"}
          icon={AlertTriangle}
          theme={stats.activeHealthAlerts > 0 ? "amber" : "green"}
        />
      </div>


      {/* Main Grid: GIS Map & Weather */}
      <div className="grid-7-5">
        {/* Farm GIS Mapping Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <MapPin size={20} color="var(--primary)" />
              <div>
                <h2>Farm Map</h2>
                <span className="card-subtitle">
                  View your farms and field locations on the map
                </span>
              </div>
            </div>
            <Link to="/farms" className="btn btn-secondary btn-sm">
              Manage My Farms <ChevronRight size={15} />
            </Link>
          </div>


          <FarmMap farms={farms} height="360px" />
        </div>


        {/* Agro-Weather & Spraying Advisory */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <div className="card-header-left">
              <Sun size={20} color="#d97706" />
              <div>
                <h2>Weather</h2>
                <span className="card-subtitle">Current weather for your farm</span>
              </div>
            </div>
            <Link to="/weather" className="btn btn-secondary btn-sm">
              View Forecast <ChevronRight size={15} />
            </Link>
          </div>


          {weather?.current && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
                  padding: "18px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {weather.current.temperature}°C
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    {weather.current.description} • Feels like {weather.current.feelsLike}°C
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Humidity: <strong>{weather.current.humidity}%</strong>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Wind: <strong>{weather.current.windSpeed} km/h</strong>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Rain: <strong>{weather.current.rainfall} mm</strong>
                  </div>
                </div>
              </div>


              {/* Spraying Advisory Condition */}
              {weather.sprayingAdvisory && (
                <div
                  style={{
                    background: "var(--bg-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    borderLeft: `4px solid ${
                      weather.sprayingAdvisory.status === "Optimal" ? "#16a34a" : "#d97706"
                    }`,
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.84rem", fontWeight: 700 }}>Spraying Advice:</span>
                    <AlertBadge text={weather.sprayingAdvisory.status} />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {weather.sprayingAdvisory.reason}
                  </p>
                </div>
              )}


              {/* Weather Alert */}
              {weather.alerts && weather.alerts.length > 0 && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    fontSize: "0.82rem",
                    color: "#92400e",
                  }}
                >
                  <strong>{weather.alerts[0].type}:</strong> {weather.alerts[0].message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Row: AI Recommendations & Market Ticker */}
      <div className="grid-7-5">
        {/* AI Recommendations Priority Feed */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <Sparkles size={20} color="var(--primary)" />
              <div>
                <h2>Smart Recommendations</h2>
                <span className="card-subtitle">
                  Helpful advice based on weather, crops, soil, and market information
                </span>
              </div>
            </div>
            <Link to="/recommendations" className="btn btn-secondary btn-sm">
              View All ({recommendations?.length || 0}) <ChevronRight size={15} />
            </Link>
          </div>


          <div>
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <div key={rec.id} className={`rec-card rec-priority-${rec.priority}`}>
                  <div className="rec-header">
                    <div>
                      <span className="rec-title">{rec.title}</span>
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <AlertBadge text={rec.category} />
                        <AlertBadge priority={rec.priority} />
                      </div>
                    </div>
                  </div>
                  <p className="rec-desc">{rec.description}</p>
                  <div className="rec-action-box">
                    <strong>What to do:</strong> {rec.action}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No urgent recommendations. Your farm is doing well.
              </p>
            )}
          </div>
        </div>


        {/* Market Trends Snapshot & Active Schedules */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Market Pulse Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <TrendingUp size={20} color="#0284c7" />
                <div>
                  <h2>Market Prices</h2>
                  <span className="card-subtitle">Current prices and price trends</span>
                </div>
              </div>
              <Link to="/market" className="btn btn-secondary btn-sm">
                View Market Prices <ChevronRight size={15} />
              </Link>
            </div>


            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Current Price</th>
                    <th>Price Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {marketHighlights?.topCommodities?.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <strong>{item.cropName}</strong>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {item.marketName}
                        </div>
                      </td>
                      <td>
                        <strong>
                          {item.unit} {item.currentPrice}
                        </strong>
                      </td>
                      <td>
                        <AlertBadge
                          text={`${item.trend === "up" ? "+" : ""}${item.priceChangePercent}%`}
                          type={item.trend}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


          {/* Pending Smart Irrigation Schedules */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <Droplets size={20} color="var(--primary)" />
                <div>
                  <h2>Upcoming Watering</h2>
                  <span className="card-subtitle">Best watering time based on rainfall</span>
                </div>
              </div>
              <Link to="/irrigation" className="btn btn-secondary btn-sm">
                View Schedule <ChevronRight size={15} />
              </Link>
            </div>


            {pendingSchedules && pendingSchedules.length > 0 ? (
              pendingSchedules.map((sched) => (
                <div
                  key={sched._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-subtle)",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      {sched.crop?.name} ({sched.farm?.name})
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Scheduled: {new Date(sched.scheduledDate).toLocaleDateString()} • Method:{" "}
                      {sched.irrigationMethod}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--primary)" }}>
                      {sched.waterRequirementMm} mm
                    </div>
                    <AlertBadge text={sched.status} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No watering planned for today.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default DashboardPage;