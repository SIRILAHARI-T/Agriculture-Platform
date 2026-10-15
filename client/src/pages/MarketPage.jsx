import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ShoppingBag,
  ArrowUpRight,
  X,
  AlertCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import API from "../services/api";
import AlertBadge from "../components/common/AlertBadge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";

const CATEGORIES = ["All", "Cereal", "Vegetable", "Cash Crop", "Oilseed"];

// Format ISO date (YYYY-MM-DD) for display
const formatDisplayDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return "";
  try {
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      if (!isNaN(day) && months[monthIdx]) {
        return `${day} ${months[monthIdx]} '${year.slice(-2)}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const MarketPage = () => {
  const [prices, setPrices] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/market");
      if (res.data?.success) {
        const fetchedPrices = Array.isArray(res.data.prices)
          ? res.data.prices
          : [];
        setPrices(fetchedPrices);

        if (fetchedPrices.length > 0 && !selectedItem) {
          setSelectedItem(fetchedPrices[0]);
        }
      } else {
        setError(res.data?.message || "Failed to load market prices.");
      }
    } catch (err) {
      console.error("Failed to load market prices:", err);
      setError(
        err.response?.data?.message ||
          "Could not connect to market price service. Please check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // Safe sorted historical data for a market item
  const getSortedHistory = (item) => {
    if (!item || !Array.isArray(item.history)) return [];
    return [...item.history]
      .filter((h) => h && h.date && typeof h.price === "number")
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  };

  // Client-side filtering ensures instant response with zero lag or input defocusing
  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      // 1. Category filter
      if (category !== "All") {
        const itemCat = String(item.category || "").toLowerCase();
        const targetCat = category.toLowerCase();

        if (itemCat !== targetCat) {
          const cropLower = String(item.cropName || "").toLowerCase();
          if (
            targetCat === "cereal" &&
            (cropLower.includes("maize") ||
              cropLower.includes("paddy") ||
              cropLower.includes("rice") ||
              cropLower.includes("wheat") ||
              cropLower.includes("corn"))
          ) {
            // Matches cereal
          } else if (
            targetCat === "vegetable" &&
            (cropLower.includes("tomato") ||
              cropLower.includes("potato") ||
              cropLower.includes("onion"))
          ) {
            // Matches vegetable
          } else if (
            targetCat === "cash crop" &&
            (cropLower.includes("cotton") ||
              cropLower.includes("sugarcane"))
          ) {
            // Matches cash crop
          } else if (
            targetCat === "oilseed" &&
            (cropLower.includes("groundnut") ||
              cropLower.includes("mustard") ||
              cropLower.includes("sunflower") ||
              cropLower.includes("soyabean"))
          ) {
            // Matches oilseed
          } else {
            return false;
          }
        }
      }

      // 2. Search filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const qNoSpace = q.replace(/\s+/g, "");

        const cropName = String(item.cropName || "").toLowerCase();
        const marketName = String(item.marketName || "").toLowerCase();
        const marketNoSpace = marketName.replace(/\s+/g, "");
        const variety = String(item.variety || "").toLowerCase();
        const state = String(item.state || "").toLowerCase();
        const district = String(item.district || "").toLowerCase();

        // Support searching Paddy & Rice interchangeably
        const matchesPaddyRice =
          (q.includes("rice") &&
            (cropName.includes("paddy") || variety.includes("rice"))) ||
          (q.includes("paddy") &&
            (cropName.includes("rice") || variety.includes("paddy")));

        const matches =
          cropName.includes(q) ||
          marketName.includes(q) ||
          marketNoSpace.includes(qNoSpace) ||
          variety.includes(q) ||
          state.includes(q) ||
          district.includes(q) ||
          matchesPaddyRice;

        if (!matches) return false;
      }

      return true;
    });
  }, [prices, category, search]);

  const handleOpenChart = (item) => {
    setSelectedItem(item);
    setIsChartModalOpen(true);
  };

  // Reusable Chart Component
  const renderPriceChart = (item, isModal = false) => {
    if (!item) return null;
    const history = getSortedHistory(item);

    return (
      <div>
        {/* Selected Commodity Metrics Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "rgba(21, 128, 61, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                {item.cropName}
              </h3>
              <span
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                }}
              >
                Market: <strong>{item.marketName}</strong> • Variety:{" "}
                <strong>{item.variety || "Standard"}</strong> • Demand:{" "}
                <strong>{item.demandLevel || "Moderate"}</strong>
              </span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {item.unit || "₹/Kg"} {item.currentPrice}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "6px",
              }}
            >
              {item.trend === "up" ? (
                <TrendingUp size={16} color="#16a34a" />
              ) : (
                <TrendingDown size={16} color="#dc2626" />
              )}
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: item.trend === "up" ? "#16a34a" : "#dc2626",
                }}
              >
                {item.trend === "up" ? "+" : ""}
                {item.priceChangePercent}% vs Previous Price (
                {item.unit || "₹/Kg"} {item.previousPrice})
              </span>
            </div>
          </div>
        </div>

        {/* Selling Advice Banner */}
        <div
          style={{
            padding: "10px 14px",
            background: "var(--bg-subtle)",
            borderRadius: "var(--radius-md)",
            borderLeft: "4px solid var(--primary)",
            marginBottom: "16px",
            fontSize: "0.86rem",
          }}
        >
          <strong>Selling Advice: </strong>{" "}
          {item.recommendation || "Compare nearby mandis before selling."}
        </div>

        {/* Recharts Area Chart */}
        {history.length > 1 ? (
          <div>
            <div style={{ height: isModal ? "280px" : "260px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={history}
                  margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={formatDisplayDate}
                    angle={-20}
                    textAnchor="end"
                    height={35}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${val} / Kg`, "Market Price"]}
                    labelFormatter={(lbl) => `Date: ${formatDisplayDate(lbl)}`}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#15803d"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#15803d", strokeWidth: 1 }}
                    activeDot={{ r: 6, fill: "#15803d" }}
                    fillOpacity={1}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}
            >
              <span>
                Historical Range: {formatDisplayDate(history[0].date)} to{" "}
                {formatDisplayDate(history[history.length - 1].date)}
              </span>
              <span>{history.length} price records sorted chronologically</span>
            </div>
          </div>
        ) : history.length === 1 ? (
          <div>
            <div style={{ height: "200px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={history}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={formatDisplayDate}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${val} / Kg`, "Market Price"]}
                    labelFormatter={(lbl) => `Date: ${formatDisplayDate(lbl)}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#15803d"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "#15803d" }}
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div
              style={{
                padding: "8px 12px",
                background: "#f8fafc",
                borderRadius: "6px",
                fontSize: "0.82rem",
                color: "#64748b",
                marginTop: "8px",
              }}
            >
              ℹ️ Only 1 recorded market arrival date (
              {formatDisplayDate(history[0].date)}) is currently available for{" "}
              {item.marketName}. Additional price data will be plotted as new
              mandi arrivals report.
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "36px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.88rem",
            }}
          >
            No historical price records available for this market.
          </div>
        )}
      </div>
    );
  };

  if (loading && prices.length === 0) {
    return <LoadingSpinner message="Loading market prices..." />;
  }

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
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            Crop Market Prices
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Current market prices, recent price changes, and selling advice
          </p>
        </div>

        {/* Filter & Search */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-light)",
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "32px", width: "220px" }}
              placeholder="Search crop or market..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "2px",
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "4px" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${
                  category === cat ? "btn-primary" : "btn-secondary"
                }`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchPrices}
            title="Refresh market prices"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-md)",
            color: "#dc2626",
            fontSize: "0.85rem",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchPrices}
            style={{ fontSize: "0.8rem", padding: "4px 10px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Selected Commodity Interactive Chart Panel (On Page) */}
      {selectedItem && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Active Commodity Trend Analysis
            </span>
          </div>

          {renderPriceChart(selectedItem, false)}
        </div>
      )}

      {/* Dedicated View Price Chart Modal */}
      {selectedItem && (
        <Modal
          isOpen={isChartModalOpen}
          onClose={() => setIsChartModalOpen(false)}
          title={`${selectedItem.cropName} Price Trend — ${selectedItem.marketName} Mandi`}
          maxWidth="720px"
        >
          {renderPriceChart(selectedItem, true)}

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() => setIsChartModalOpen(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Commodity Prices Grid */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ fontSize: "1.1rem", margin: 0 }}>
            Crop Price List ({filteredPrices.length}{" "}
            {filteredPrices.length !== prices.length
              ? `of ${prices.length} items`
              : "items"}
            )
          </h3>

          {(search || category !== "All") && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.8rem" }}
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Category</th>
                <th>Market</th>
                <th>Current Price</th>
                <th>Previous Price</th>
                <th>Change</th>
                <th>Price Range (Min - Max)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrices.length > 0 ? (
                filteredPrices.map((item) => (
                  <tr
                    key={item._id}
                    style={{
                      backgroundColor:
                        selectedItem?._id === item._id
                          ? "rgba(34, 197, 94, 0.08)"
                          : "transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <td>
                      <strong>{item.cropName}</strong>
                      {item.variety && item.variety !== "Other" && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {item.variety}
                        </span>
                      )}
                    </td>
                    <td>
                      <AlertBadge text={item.category || "Cereal"} />
                    </td>
                    <td>{item.marketName}</td>
                    <td>
                      <strong style={{ fontSize: "0.95rem" }}>
                        {item.unit || "₹/Kg"} {item.currentPrice}
                      </strong>
                    </td>
                    <td>
                      {item.unit || "₹/Kg"} {item.previousPrice}
                    </td>
                    <td>
                      <AlertBadge
                        text={`${item.trend === "up" ? "+" : ""}${
                          item.priceChangePercent
                        }%`}
                        type={item.trend}
                      />
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.minPrice
                          ? `${item.minPrice} - ${item.maxPrice}`
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenChart(item);
                        }}
                        title={`View Price Chart for ${item.cropName} at ${item.marketName}`}
                      >
                        View Price Chart <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", padding: "36px 20px" }}
                  >
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.9rem",
                        marginBottom: "10px",
                      }}
                    >
                      No crop market records found matching{" "}
                      {search && <strong>"{search}"</strong>}
                      {category !== "All" && ` in ${category} category`}.
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSearch("");
                        setCategory("All");
                      }}
                    >
                      Clear search & filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
