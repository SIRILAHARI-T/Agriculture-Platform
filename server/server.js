const dns = require("dns");

// Preserve DNS resolution for MongoDB Atlas SRV connection
dns.setServers(["8.8.8.8", "1.1.1.1"]);

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
    console.log("MongoDB Atlas connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error);
  });


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
