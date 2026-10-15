const Farm = require("../models/Farm");
const { getWeatherByCoordinates } = require("../services/weatherService");

// @desc    Get weather for a specific farm or coordinates
// @route   GET /api/weather
// @access  Private
const getWeather = async (req, res) => {
  try {
    const { farmId, lat, lng } = req.query;

    let latitude;
    let longitude;
    let farmName = "Current Coordinates";

    if (farmId) {
      const farm = await Farm.findOne({ _id: farmId, user: req.user._id });
      if (farm && farm.coordinates?.latitude && farm.coordinates?.longitude) {
        latitude = farm.coordinates.latitude;
        longitude = farm.coordinates.longitude;
        farmName = farm.name;
      }
    }

    // Fallback: If no farmId or farm doesn't exist, check query coordinates
    if (!latitude || !longitude) {
      if (lat && lng) {
        latitude = parseFloat(lat);
        longitude = parseFloat(lng);
      } else {
        // Find user's first registered farm
        const firstFarm = await Farm.findOne({ user: req.user._id });
        if (firstFarm && firstFarm.coordinates?.latitude && firstFarm.coordinates?.longitude) {
          latitude = firstFarm.coordinates.latitude;
          longitude = firstFarm.coordinates.longitude;
          farmName = firstFarm.name;
        } else {
          // Default to Punjab agricultural belt
          latitude = 30.901;
          longitude = 75.8573;
          farmName = "Central Farmland (Default)";
        }
      }
    }

    const weatherData = await getWeatherByCoordinates(latitude, longitude);

    res.json({
      success: true,
      farmName,
      data: weatherData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWeather,
};

