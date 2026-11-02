const IrrigationSchedule = require("../models/IrrigationSchedule");
const Crop = require("../models/Crop");
const Farm = require("../models/Farm");
const { calculateWaterRequirement } = require("../services/irrigationService");
const { getWeatherByCoordinates } = require("../services/weatherService");

// @desc    Get smart irrigation overview with real-time water requirements
// @route   GET /api/irrigation/overview
// @access  Private
const getIrrigationOverview = async (req, res) => {
  try {
    const crops = await Crop.find({ user: req.user._id, growthStage: { $ne: "Harvested" } }).populate("farm");
    const farms = await Farm.find({ user: req.user._id });

    // Fetch primary weather for computation
    let primaryWeather = {};
    if (farms.length > 0 && farms[0].coordinates) {
      primaryWeather = await getWeatherByCoordinates(
        farms[0].coordinates.latitude,
        farms[0].coordinates.longitude
      );
    }

    // Compute live water requirements for each active crop
    const cropRequirements = crops.map((crop) => {
      const farm = crop.farm || farms[0] || { soilType: "Loamy", totalArea: 5 };
      return {
        cropId: crop._id,
        farmId: farm._id,
        farmName: farm.name || "Default Farm",
        ...calculateWaterRequirement(crop, farm, primaryWeather),
      };
    });

    // Total daily water needed across all plots
    const totalDailyLiters = cropRequirements.reduce((acc, curr) => acc + curr.totalWaterLiters, 0);

    // Upcoming scheduled runs
    const upcomingSchedules = await IrrigationSchedule.find({
      user: req.user._id,
      status: "Pending",
    })
      .populate("crop", "name variety")
      .populate("farm", "name")
      .sort({ scheduledDate: 1 })
      .limit(5);

    res.json({
      success: true,
      totalDailyLiters,
      activeCropsCount: crops.length,
      cropRequirements,
      upcomingSchedules,
      weatherSnapshot: primaryWeather.current || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all irrigation schedules
// @route   GET /api/irrigation/schedules
// @access  Private
const getSchedules = async (req, res) => {
  try {
    const schedules = await IrrigationSchedule.find({ user: req.user._id })
      .populate("crop", "name variety growthStage")
      .populate("farm", "name location")
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error) {
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

    if (!farm || !crop || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Please specify farm, crop, and scheduled date",
      });
    }

    const schedule = await IrrigationSchedule.create({
      user: req.user._id,
      farm,
      crop,
      waterRequirementMm: waterRequirementMm || 20,
      waterRequirementLiters: waterRequirementLiters || 0,
      irrigationMethod: irrigationMethod || "Drip",
      scheduledDate,
      notes: notes || "",
    });

    const populated = await IrrigationSchedule.findById(schedule._id)
      .populate("crop", "name")
      .populate("farm", "name");

    res.status(201).json({
      success: true,
      message: "Irrigation scheduled successfully",
      schedule: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update schedule status (Completed / Postponed)
// @route   PATCH /api/irrigation/schedules/:id/status
// @access  Private
const updateScheduleStatus = async (req, res) => {
  try {
    const { status, weatherAdjustmentReason } = req.body;
    const schedule = await IrrigationSchedule.findOne({ _id: req.params.id, user: req.user._id });

    if (!schedule) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    if (status) schedule.status = status;
    if (status === "Completed") schedule.completedAt = new Date();
    if (weatherAdjustmentReason) schedule.weatherAdjustmentReason = weatherAdjustmentReason;

    await schedule.save();

    res.json({
      success: true,
      message: `Schedule status updated to ${status}`,
      schedule,
    });
  } catch (error) {
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
    res.json({ success: true, message: "Irrigation schedule deleted" });
  } catch (error) {
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

