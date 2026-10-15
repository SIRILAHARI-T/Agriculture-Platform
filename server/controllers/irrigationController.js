const IrrigationSchedule = require("../models/IrrigationSchedule");
const Crop = require("../models/Crop");
const Farm = require("../models/Farm");
const { calculateWaterRequirement, LITERS_PER_MM_PER_ACRE } = require("../services/irrigationService");
const { getWeatherByCoordinates } = require("../services/weatherService");

// @desc    Get smart irrigation overview with real-time water requirements
// @route   GET /api/irrigation/overview
// @access  Private
const getIrrigationOverview = async (req, res) => {
  try {
    const crops = await Crop.find({ user: req.user._id, growthStage: { $ne: "Harvested" } }).populate("farm");
    const farms = await Farm.find({ user: req.user._id });

    // Weather caching map by coordinate string to avoid duplicate weather calls
    const weatherCache = {};

    const getWeatherForFarm = async (farm) => {
      const coords = farm?.coordinates || farms[0]?.coordinates || { latitude: 11.0168, longitude: 76.9558 };
      const key = `${coords.latitude},${coords.longitude}`;
      if (!weatherCache[key]) {
        weatherCache[key] = await getWeatherByCoordinates(coords.latitude, coords.longitude);
      }
      return weatherCache[key];
    };

    // Compute live water requirements for each active crop
    const cropRequirements = [];
    for (const crop of crops) {
      const farm = crop.farm || farms[0] || { soilType: "Loamy", totalArea: 5, name: "Default Farm" };
      const weather = await getWeatherForFarm(farm);

      cropRequirements.push({
        cropId: crop._id,
        farmId: farm._id,
        farmName: farm.name || "Default Farm",
        ...calculateWaterRequirement(crop, farm, weather),
      });
    }

    // Total daily water needed across all plots
    const totalDailyLiters = cropRequirements.reduce((acc, curr) => acc + (curr.totalWaterLiters || 0), 0);

    // Upcoming scheduled runs (Pending)
    const upcomingSchedules = await IrrigationSchedule.find({
      user: req.user._id,
      status: "Pending",
    })
      .populate("crop", "name variety allocatedArea")
      .populate("farm", "name soilType")
      .sort({ scheduledDate: 1 });

    const primaryWeather = farms.length > 0 ? await getWeatherForFarm(farms[0]) : {};

    res.json({
      success: true,
      totalDailyLiters,
      activeCropsCount: crops.length,
      cropRequirements,
      upcomingSchedules,
      weatherSnapshot: primaryWeather.current || null,
    });
  } catch (error) {
    console.error("Irrigation overview error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all irrigation schedules
// @route   GET /api/irrigation/schedules
// @access  Private
const getSchedules = async (req, res) => {
  try {
    const schedules = await IrrigationSchedule.find({ user: req.user._id })
      .populate("crop", "name variety growthStage allocatedArea")
      .populate("farm", "name location soilType totalArea")
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    console.error("Get schedules error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create an irrigation schedule
// @route   POST /api/irrigation/schedules
// @access  Private
const createSchedule = async (req, res) => {
  try {
    const {
      farm,
      crop,
      waterRequirementMm,
      waterRequirementLiters,
      irrigationMethod,
      scheduledDate,
      notes,
    } = req.body;

    if (!crop) {
      return res.status(400).json({
        success: false,
        message: "Please select a crop for the watering schedule.",
      });
    }

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Please select a scheduled date.",
      });
    }

    const parsedDate = new Date(scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date format.",
      });
    }

    const mm = Number(waterRequirementMm);
    if (!Number.isFinite(mm) || mm <= 0) {
      return res.status(400).json({
        success: false,
        message: "Water depth (mm) must be a positive number greater than 0.",
      });
    }

    // Verify crop ownership and find association
    const cropDoc = await Crop.findOne({ _id: crop, user: req.user._id });
    if (!cropDoc) {
      return res.status(404).json({
        success: false,
        message: "Selected crop was not found in your account.",
      });
    }

    const farmId = farm || cropDoc.farm;
    const acres = Number(cropDoc.allocatedArea) || 1;
    const computedLiters = Math.round(mm * LITERS_PER_MM_PER_ACRE * acres);
    const finalLiters = Number(waterRequirementLiters) > 0 ? Number(waterRequirementLiters) : computedLiters;

    const schedule = await IrrigationSchedule.create({
      user: req.user._id,
      farm: farmId,
      crop: cropDoc._id,
      waterRequirementMm: mm,
      waterRequirementLiters: finalLiters,
      irrigationMethod: irrigationMethod || "Drip",
      scheduledDate: parsedDate,
      notes: notes ? String(notes).trim() : "",
      status: "Pending",
    });

    const populated = await IrrigationSchedule.findById(schedule._id)
      .populate("crop", "name variety growthStage allocatedArea")
      .populate("farm", "name location soilType");

    res.status(201).json({
      success: true,
      message: "Irrigation scheduled successfully",
      schedule: populated,
    });
  } catch (error) {
    console.error("Create schedule error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update schedule status (Completed / Postponed due to Rain / Skipped)
// @route   PATCH /api/irrigation/schedules/:id/status
// @access  Private
const updateScheduleStatus = async (req, res) => {
  try {
    const { status, weatherAdjustmentReason } = req.body;
    const schedule = await IrrigationSchedule.findOne({ _id: req.params.id, user: req.user._id });

    if (!schedule) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    if (status) {
      const allowed = ["Pending", "Completed", "Postponed due to Rain", "Skipped"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      schedule.status = status;
      if (status === "Completed") schedule.completedAt = new Date();
    }

    if (weatherAdjustmentReason) {
      schedule.weatherAdjustmentReason = weatherAdjustmentReason;
    }

    await schedule.save();

    res.json({
      success: true,
      message: `Schedule status updated to ${status}`,
      schedule,
    });
  } catch (error) {
    console.error("Update schedule status error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete schedule
// @route   DELETE /api/irrigation/schedules/:id
// @access  Private
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await IrrigationSchedule.findOne({ _id: req.params.id, user: req.user._id });
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    await schedule.deleteOne();
    res.json({ success: true, message: "Irrigation schedule deleted successfully" });
  } catch (error) {
    console.error("Delete schedule error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getIrrigationOverview,
  getSchedules,
  createSchedule,
  updateScheduleStatus,
  deleteSchedule,
};
