import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Search, Filter, ShoppingBag, ArrowUpRight } from "lucide-react";
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


const CATEGORIES = ["All", "Cereal", "Vegetable", "Cash Crop", "Oilseed"];


const MarketPage = () => {
  const [prices, setPrices] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchPrices();
  }, [category, search]);


  const fetchPrices = async () => {
    try {
      setLoading(true);
      let query = `?category=${category}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;


      const res = await API.get(`/market${query}`);
      if (res.data.success) {
        setPrices(res.data.prices);
        if (res.data.prices.length > 0 && !selectedItem) {
          setSelectedItem(res.data.prices[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load market prices:", err);
    } finally {
      setLoading(false);
    }
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
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
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
              style={{ paddingLeft: "32px", width: "200px" }}
              placeholder="Search crop or market..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>


          <div style={{ display: "flex", gap: "4px" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${category === cat ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Selected Commodity Interactive Chart Panel */}
      {selectedItem && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <div className="card-header-left">
              <ShoppingBag size={22} color="var(--primary)" />
              <div>
                <h3 style={{ fontSize: "1.2rem" }}>{selectedItem.cropName}</h3>
                <span className="card-subtitle">
                  Market: <strong>{selectedItem.marketName}</strong> • Demand:{" "}
                  <strong>{selectedItem.demandLevel}</strong>
                </span>
              </div>
            </div>


            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {selectedItem.unit} {selectedItem.currentPrice}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                {selectedItem.trend === "up" ? (
                  <TrendingUp size={16} color="#16a34a" />
                ) : (
                  <TrendingDown size={16} color="#dc2626" />
                )}
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: selectedItem.trend === "up" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {selectedItem.trend === "up" ? "+" : ""}
                  {selectedItem.priceChangePercent}% vs Previous Price
                </span>
              </div>
            </div>
          </div>


          {/* Market Recommendation Banner */}
          <div
            style={{
              padding: "12px 16px",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-md)",
              borderLeft: "4px solid var(--primary)",
              marginBottom: "20px",
              fontSize: "0.88rem",
            }}
          >
            <strong>Selling Advice: </strong> {selectedItem.recommendation}
          </div>


          {/* Recharts 14-Day Price Area Chart */}
          <div style={{ height: "260px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={selectedItem.history || []}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  formatter={(val) => [`₹${val} / Kg`, "Market Price"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#15803d"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


      {/* Commodity Prices Grid */}
      <div className="card">
        <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>
          Crop Price List ({prices.length} items)
        </h3>


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
              {prices.map((item) => (
                <tr
                  key={item._id}
                  style={{
                    backgroundColor: selectedItem?._id === item._id ? "#f0fdf4" : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedItem(item)}
                >
                  <td>
                    <strong>{item.cropName}</strong>
                  </td>
                  <td>
                    <AlertBadge text={item.category} />
                  </td>
                  <td>{item.marketName}</td>
                  <td>
                    <strong style={{ fontSize: "0.95rem" }}>
                      {item.unit} {item.currentPrice}
                    </strong>
                  </td>
                  <td>
                    {item.unit} {item.previousPrice}
                  </td>
                  <td>
                    <AlertBadge
                      text={`${item.trend === "up" ? "+" : ""}${item.priceChangePercent}%`}
                      type={item.trend}
                    />
                  </td>
                  <td>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {item.minPrice ? `${item.minPrice} - ${item.maxPrice}` : "—"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                    >
                      View Price Chart <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default MarketPage;

