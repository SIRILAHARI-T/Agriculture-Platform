import React, { useState, useEffect } from "react";
import {
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Compass,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import API from "../services/api";
import AlertBadge from "../components/common/AlertBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";


const WeatherPage = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchFarmsAndWeather();
  }, []);


  const fetchFarmsAndWeather = async () => {
    try {
      setLoading(true);
      const farmsRes = await API.get("/farms");
      if (farmsRes.data.success) {
        const farmList = farmsRes.data.farms;
        setFarms(farmList);
        const initialFarmId = farmList.length > 0 ? farmList[0]._id : "";
        setSelectedFarmId(initialFarmId);
        fetchWeatherForFarm(initialFarmId);
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setLoading(false);
    }
  };


  const fetchWeatherForFarm = async (farmId) => {
    try {
      setLoading(true);
      const res = await API.get(`/weather?farmId=${farmId}`);
      if (res.data.success) {
        setWeatherData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleFarmChange = (e) => {
    const id = e.target.value;
    setSelectedFarmId(id);
    fetchWeatherForFarm(id);
  };


  if (loading && !weatherData) {
    return <LoadingSpinner message="Loading weather information..." />;
  }


  const current = weatherData?.data?.current;
  const forecast = weatherData?.data?.forecast || [];
  const alerts = weatherData?.data?.alerts || [];
  const spraying = weatherData?.data?.sprayingAdvisory;


  // Chart data format
  const chartData = forecast.map((f) => ({
    name: f.dayName || f.date.slice(5),
    "Max Temp (°C)": f.maxTemp,
    "Min Temp (°C)": f.minTemp,
    "Rainfall (mm)": f.precipitationSum,
  }));


  return (
    <div>
      {/* Header with farm selector */}
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
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Weather Information</h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Farm: <strong>{weatherData?.farmName || "Primary Farmland"}</strong> (Lat:{" "}
            {weatherData?.data?.latitude?.toFixed(4)}, Lng: {weatherData?.data?.longitude?.toFixed(4)})
          </p>
        </div>


        {farms.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Select Farm:</span>
            <select
              className="form-select"
              style={{ width: "220px" }}
              value={selectedFarmId}
              onChange={handleFarmChange}
            >
              {farms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>


      {/* Weather Alerts */}
      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          {alerts.map((al, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderRadius: "var(--radius-md)",
                background: al.severity === "High" ? "#fef2f2" : "#fffbeb",
                border: `1px solid ${al.severity === "High" ? "#fecaca" : "#fde68a"}`,
                color: al.severity === "High" ? "#991b1b" : "#92400e",
                marginBottom: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <AlertTriangle size={20} />
                <div>
                  <strong>{al.type}:</strong> {al.message}
                </div>
              </div>
              <AlertBadge priority={al.severity} />
            </div>
          ))}
        </div>
      )}


      {/* Current Conditions Card */}
      {current && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <div className="card-header-left">
              <Sun size={22} color="#d97706" />
              <div>
                <h3>Current Weather</h3>
                <span className="card-subtitle">Last updated: {new Date(current.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
            <AlertBadge text={current.condition} />
          </div>


          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              style={{
                background: "var(--bg-subtle)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
              }}
            >
              <Thermometer size={24} color="#dc2626" style={{ margin: "0 auto 6px auto" }} />
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Temperature
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{current.temperature}°C</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Feels like {current.feelsLike}°C
              </div>
            </div>


            <div
              style={{
                background: "var(--bg-subtle)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
              }}
            >
              <Droplets size={24} color="#0284c7" style={{ margin: "0 auto 6px auto" }} />
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Humidity
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{current.humidity}%</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Moisture in the air</div>
            </div>


            <div
              style={{
                background: "var(--bg-subtle)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
              }}
            >
              <CloudRain size={24} color="#2563eb" style={{ margin: "0 auto 6px auto" }} />
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Rainfall
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{current.rainfall} mm</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Current rainfall</div>
            </div>


            <div
              style={{
                background: "var(--bg-subtle)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
              }}
            >
              <Wind size={24} color="#059669" style={{ margin: "0 auto 6px auto" }} />
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Wind Speed
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{current.windSpeed} km/h</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Wind speed near the ground</div>
            </div>


            <div
              style={{
                background: "var(--bg-subtle)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
              }}
            >
              <Sun size={24} color="#f59e0b" style={{ margin: "0 auto 6px auto" }} />
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Sunlight Level
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{current.uvIndex} / 11</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sun exposure level</div>
            </div>
          </div>


          {/* Spraying Advisory Banner */}
          {spraying && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                background: spraying.status === "Optimal" ? "#f0fdf4" : "#fffbeb",
                border: `1px solid ${spraying.status === "Optimal" ? "#bbf7d0" : "#fde68a"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <strong
                  style={{
                    color: spraying.status === "Optimal" ? "#166534" : "#92400e",
                    fontSize: "0.92rem",
                  }}
                >
                  Spraying Advice: {spraying.status}
                </strong>
                <p style={{ fontSize: "0.84rem", color: "#475569", marginTop: "2px" }}>
                  {spraying.reason}
                </p>
              </div>
              <AlertBadge text={spraying.status} />
            </div>
          )}
        </div>
      )}


      {/* 7-Day Temperature Curve (Recharts) */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-header-left">
            <Calendar size={20} color="var(--primary)" />
            <div>
              <h3>7-Day Weather Forecast</h3>
              <span className="card-subtitle">Temperature changes and expected rainfall</span>
            </div>
          </div>
        </div>


        <div style={{ height: "280px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Max Temp (°C)"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Min Temp (°C)"
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Rainfall (mm)"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* 7-Day Forecast Day Cards */}
      <div className="card">
        <h3 style={{ fontSize: "1.05rem", marginBottom: "16px" }}>7-Day Weather Outlook</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "12px",
          }}
        >
          {forecast.map((day, idx) => (
            <div
              key={idx}
              style={{
                background: idx === 0 ? "var(--primary-light)" : "var(--bg-subtle)",
                border: `1px solid ${idx === 0 ? "var(--primary-border)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                padding: "14px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                {idx === 0 ? "Today" : day.date.slice(5)}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                {day.condition}
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {day.maxTemp}° / <span style={{ color: "var(--text-muted)" }}>{day.minTemp}°</span>
              </div>
              <div
                style={{
                  fontSize: "0.74rem",
                  color: "#0284c7",
                  fontWeight: 600,
                  marginTop: "6px",
                }}
              >
                Rain: {day.precipitationSum} mm
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default WeatherPage;

