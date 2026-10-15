const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Route imports
const authRoutes = require("./routes/authRoutes");
const farmRoutes = require("./routes/farmRoutes");
const cropRoutes = require("./routes/cropRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const healthRoutes = require("./routes/healthRoutes");
const irrigationRoutes = require("./routes/irrigationRoutes");
const marketRoutes = require("./routes/marketRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Base health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    platform: "AI Powered Smart Farming and Agriculture Recommendation System",
    status: "Active",
    timestamp: new Date().toISOString(),
  });
});

// System health/status endpoint (does NOT require auth, does NOT expose credentials)
app.get("/api/status", (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";
  const httpStatus = dbState === 1 ? 200 : 503;
  res.status(httpStatus).json({
    status: dbState === 1 ? "ok" : "degraded",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use("/api/auth", authRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/irrigation", irrigationRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// MongoDB Atlas connection

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("MongoDB local database connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error);
  });


const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
