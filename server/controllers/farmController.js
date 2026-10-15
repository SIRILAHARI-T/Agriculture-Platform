const Farm = require("../models/Farm");
const Crop = require("../models/Crop");

// @desc    Get all farms for logged in farmer
// @route   GET /api/farms
// @access  Private
const getFarms = async (req, res) => {
  try {
    const farms = await Farm.find({ user: req.user._id }).sort({ createdAt: -1 });

    // Attach active crop count to each farm
    const farmsWithStats = await Promise.all(
      farms.map(async (farm) => {
        const cropCount = await Crop.countDocuments({ farm: farm._id });
        const crops = await Crop.find({ farm: farm._id }).select("name growthStage currentHealthStatus");
        return {
          ...farm.toObject(),
          cropCount,
          crops,
        };
      })
    );

    res.json({
      success: true,
      count: farmsWithStats.length,
      farms: farmsWithStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single farm details
// @route   GET /api/farms/:id
// @access  Private
const getFarmById = async (req, res) => {
  try {
    const farm = await Farm.findOne({ _id: req.params.id, user: req.user._id });
    if (!farm) {
      return res.status(404).json({ success: false, message: "Farm not found" });
    }

    const crops = await Crop.find({ farm: farm._id });

    res.json({
      success: true,
      farm,
      crops,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new farm
// @route   POST /api/farms
// @access  Private
const createFarm = async (req, res) => {
  try {
    const {
      name,
      location,
      totalArea,
      soilType,
      soilPh,
      organicMatter,
      coordinates,
      boundaryPoints,
      notes,
    } = req.body;

    if (!name || !totalArea || !coordinates?.latitude || !coordinates?.longitude) {
      return res.status(400).json({
        success: false,
        message: "Please provide farm name, total area, and valid coordinates (lat/lng)",
      });
    }

    const farm = await Farm.create({
      user: req.user._id,
      name,
      location: location || {},
      totalArea: parseFloat(totalArea),
      soilType: soilType || "Loamy",
      soilPh: soilPh ? parseFloat(soilPh) : 6.8,
      organicMatter: organicMatter ? parseFloat(organicMatter) : 2.5,
      coordinates: {
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude),
      },
      boundaryPoints: boundaryPoints || [],
      notes: notes || "",
    });

    res.status(201).json({
      success: true,
      message: "Farm registered successfully",
      farm,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an existing farm
// @route   PUT /api/farms/:id
// @access  Private
const updateFarm = async (req, res) => {
  try {
    let farm = await Farm.findOne({ _id: req.params.id, user: req.user._id });
    if (!farm) {
      return res.status(404).json({ success: false, message: "Farm not found" });
    }

    const {
      name,
      location,
      totalArea,
      soilType,
      soilPh,
      organicMatter,
      coordinates,
      boundaryPoints,
      notes,
    } = req.body;

    if (name) farm.name = name;
    if (location) farm.location = location;
    if (totalArea !== undefined) farm.totalArea = parseFloat(totalArea);
    if (soilType) farm.soilType = soilType;
    if (soilPh !== undefined) farm.soilPh = parseFloat(soilPh);
    if (organicMatter !== undefined) farm.organicMatter = parseFloat(organicMatter);
    if (coordinates?.latitude && coordinates?.longitude) {
      farm.coordinates = {
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude),
      };
    }
    if (boundaryPoints) farm.boundaryPoints = boundaryPoints;
    if (notes !== undefined) farm.notes = notes;

    const updatedFarm = await farm.save();

    res.json({
      success: true,
      message: "Farm details updated successfully",
      farm: updatedFarm,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a farm
// @route   DELETE /api/farms/:id
// @access  Private
const deleteFarm = async (req, res) => {
  try {
    const farm = await Farm.findOne({ _id: req.params.id, user: req.user._id });
    if (!farm) {
      return res.status(404).json({ success: false, message: "Farm not found" });
    }

    // Delete associated crops
    await Crop.deleteMany({ farm: farm._id });
    await farm.deleteOne();

    res.json({
      success: true,
      message: "Farm and associated crops deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFarms,
  getFarmById,
  createFarm,
  updateFarm,
  deleteFarm,
};

