const Farm = require("../models/Farm");
const Crop = require("../models/Crop");
const HealthLog = require("../models/HealthLog");
const MarketPrice = require("../models/MarketPrice");
const { getWeatherByCoordinates } = require("../services/weatherService");
const { generateRecommendations } = require("../services/recommendationEngine");
const { ensureMarketSeed } = require("../services/marketService");

// @desc    Get synthesized AI recommendations for logged in farmer
// @route   GET /api/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    await ensureMarketSeed();

    const [farms, crops, healthLogs, marketPrices] = await Promise.all([
      Farm.find({ user: req.user._id }),
      Crop.find({ user: req.user._id }),
      HealthLog.find({ user: req.user._id }),
      MarketPrice.find(),
    ]);

    // Fetch weather for first farm
    let weather = {};
    if (farms.length > 0 && farms[0].coordinates) {
      weather = await getWeatherByCoordinates(
        farms[0].coordinates.latitude,
        farms[0].coordinates.longitude
      );
    } else {
      weather = await getWeatherByCoordinates(30.901, 75.8573);
    }

    const recommendations = generateRecommendations({
      user: req.user,
      farms,
      crops,
      weather,
      healthLogs,
      marketPrices,
    });

    // Compute category counts
    const categoryCounts = recommendations.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      count: recommendations.length,
      highPriorityCount: recommendations.filter((r) => r.priority === "High").length,
      categoryCounts,
      recommendations,
      contextSnapshot: {
        totalFarms: farms.length,
        totalCrops: crops.length,
        weatherCondition: weather.current?.condition || "Optimal",
        temperature: weather.current?.temperature,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRecommendations,
};

