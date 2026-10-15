const Farm = require("../models/Farm");
const Crop = require("../models/Crop");
const HealthLog = require("../models/HealthLog");
const IrrigationSchedule = require("../models/IrrigationSchedule");
const MarketPrice = require("../models/MarketPrice");

const { getWeatherByCoordinates } = require("../services/weatherService");
const { generateRecommendations } = require("../services/recommendationEngine");
const { calculateWaterRequirement } = require("../services/irrigationService");

// @desc    Get aggregated farmer dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboardOverview = async (req, res) => {
  try {
    console.log("📊 Dashboard API called");

    // --------------------------------------------------
    // Fetch all dashboard data
    // --------------------------------------------------

    console.log("🔍 Fetching dashboard data...");

    const [
      farms,
      crops,
      healthLogs,
      pendingSchedules,
      marketPrices,
    ] = await Promise.all([
      Farm.find({ user: req.user._id }),

      Crop.find({ user: req.user._id })
        .populate("farm", "name location soilType"),

      HealthLog.find({
        user: req.user._id,
        resolved: false,
      }).populate("crop", "name"),

      IrrigationSchedule.find({
        user: req.user._id,
        status: "Pending",
      })
        .populate("crop", "name")
        .populate("farm", "name")
        .sort({ scheduledDate: 1 })
        .limit(3),

      // Existing market data stored in MongoDB
      MarketPrice.find().sort({
        priceChangePercent: -1,
      }),
    ]);

    console.log("✅ Dashboard data fetched");
    console.log("🏡 Farms:", farms.length);
    console.log("🌱 Crops:", crops.length);
    console.log("🚨 Health logs:", healthLogs.length);
    console.log(
      "💧 Pending schedules:",
      pendingSchedules.length
    );
    console.log(
      "📈 Market prices:",
      marketPrices.length
    );

    // --------------------------------------------------
    // Total acreage calculation
    // --------------------------------------------------

    const totalAcreage = farms.reduce(
      (acc, f) => acc + (f.totalArea || 0),
      0
    );

    console.log(
      "📐 Total acreage:",
      totalAcreage
    );

    // --------------------------------------------------
    // Weather calculation for primary farm
    // --------------------------------------------------

    let weather = {};

    if (
      farms.length > 0 &&
      farms[0].coordinates &&
      farms[0].coordinates.latitude != null &&
      farms[0].coordinates.longitude != null
    ) {
      console.log(
        "🌤️ Fetching weather using farm coordinates:",
        farms[0].coordinates
      );

      weather = await getWeatherByCoordinates(
        farms[0].coordinates.latitude,
        farms[0].coordinates.longitude
      );
    } else {
      console.log(
        "⚠️ No valid farm coordinates found. Using default coordinates."
      );

      weather = await getWeatherByCoordinates(
        30.901,
        75.8573
      );
    }

    console.log("✅ Weather fetched");

    // --------------------------------------------------
    // Daily water calculation
    // --------------------------------------------------

    const waterDemand = crops
      .filter(
        (c) => c.growthStage !== "Harvested"
      )
      .reduce((acc, c) => {
        const farm =
          c.farm ||
          farms[0] || {
            soilType: "Loamy",
            totalArea: 1,
          };

        const reqCalc =
          calculateWaterRequirement(
            c,
            farm,
            weather
          );

        return (
          acc + reqCalc.totalWaterLiters
        );
      }, 0);

    console.log(
      "💧 Daily water requirement:",
      waterDemand
    );

    // --------------------------------------------------
    // AI Recommendations
    // --------------------------------------------------

    console.log(
      "🤖 Generating recommendations..."
    );

    const allRecs =
      generateRecommendations({
        user: req.user,
        farms,
        crops,
        weather,
        healthLogs,
        marketPrices,
      });

    console.log(
      "✅ Recommendations generated:",
      allRecs.length
    );

    const topRecommendations =
      allRecs.slice(0, 4);

    // --------------------------------------------------
    // Crop stage breakdown for charts
    // --------------------------------------------------

    const stageDistribution =
      crops.reduce((acc, c) => {
        acc[c.growthStage] =
          (acc[c.growthStage] || 0) + 1;

        return acc;
      }, {});

    console.log(
      "📊 Stage distribution:",
      stageDistribution
    );

    // --------------------------------------------------
    // Send dashboard response
    // --------------------------------------------------

    res.json({
      success: true,

      farmer: {
        name: req.user.name,
        location: req.user.location,
        experienceYears:
          req.user.experienceYears,
      },

      stats: {
        totalFarms: farms.length,

        totalAcreage: parseFloat(
          totalAcreage.toFixed(1)
        ),

        totalCrops: crops.length,

        activeHealthAlerts:
          healthLogs.length,

        dailyWaterRequirementLiters:
          waterDemand,

        highPriorityRecommendations:
          allRecs.filter(
            (r) => r.priority === "High"
          ).length,
      },

      weather: {
        current:
          weather.current || null,

        alerts:
          weather.alerts || [],

        sprayingAdvisory:
          weather.sprayingAdvisory || null,
      },

      farms: farms.map((f) => ({
        _id: f._id,
        name: f.name,
        totalArea: f.totalArea,
        soilType: f.soilType,
        coordinates: f.coordinates,
        location: f.location,
      })),

      crops: crops.slice(0, 5),

      stageDistribution,

      pendingSchedules,

      healthAlerts:
        healthLogs.slice(0, 4),

      // Existing market data from MongoDB
      marketHighlights: {
        topGainer:
          marketPrices[0] || null,

        topCommodities:
          marketPrices.slice(0, 5),
      },

      recommendations:
        topRecommendations,
    });

    console.log(
      "✅ Dashboard response sent successfully"
    );
  } catch (error) {
    // --------------------------------------------------
    // Detailed error logging
    // --------------------------------------------------

    console.error(
      "\n===================================="
    );

    console.error(
      "❌ DASHBOARD API ERROR"
    );

    console.error(
      "===================================="
    );

    console.error(
      "❌ Error message:",
      error.message
    );

    console.error(
      "❌ Error name:",
      error.name
    );

    console.error(
      "❌ Error stack:"
    );

    console.error(error.stack);

    console.error(
      "====================================\n"
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardOverview,
};
