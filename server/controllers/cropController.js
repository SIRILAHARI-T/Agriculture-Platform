const Crop = require("../models/Crop");
const Farm = require("../models/Farm");

// @desc    Get all crops for logged in farmer
// @route   GET /api/crops
// @access  Private
const getCrops = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.farm) {
      filter.farm = req.query.farm;
    }

    const crops = await Crop.find(filter)
      .populate("farm", "name location soilType coordinates")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: crops.length,
      crops,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single crop
// @route   GET /api/crops/:id
// @access  Private
const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id }).populate(
      "farm",
      "name location soilType coordinates"
    );

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    res.json({
      success: true,
      crop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a crop to a farm
// @route   POST /api/crops
// @access  Private
const createCrop = async (req, res) => {
  try {
    const {
      farm,
      name,
      variety,
      category,
      plantingDate,
      expectedHarvestDate,
      allocatedArea,
      growthStage,
      currentHealthStatus,
      yieldEstimate,
      notes,
    } = req.body;

    if (!farm || !name || !plantingDate || !expectedHarvestDate || !allocatedArea) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields (farm, crop name, planting date, harvest date, area)",
      });
    }

    // Verify farm ownership
    const farmExists = await Farm.findOne({ _id: farm, user: req.user._id });
    if (!farmExists) {
      return res.status(404).json({ success: false, message: "Selected farm not found" });
    }

    const crop = await Crop.create({
      user: req.user._id,
      farm,
      name,
      variety: variety || "",
      category: category || "Cereal",
      plantingDate,
      expectedHarvestDate,
      allocatedArea: parseFloat(allocatedArea),
      growthStage: growthStage || "Vegetative",
      currentHealthStatus: currentHealthStatus || "Healthy",
      yieldEstimate: yieldEstimate || { expected: 0, unit: "Kg" },
      notes: notes || "",
    });

    const populatedCrop = await Crop.findById(crop._id).populate("farm", "name location");

    res.status(201).json({
      success: true,
      message: "Crop added successfully",
      crop: populatedCrop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update crop details or growth stage
// @route   PUT /api/crops/:id
// @access  Private
const updateCrop = async (req, res) => {
  try {
    let crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    const {
      name,
      variety,
      category,
      plantingDate,
      expectedHarvestDate,
      allocatedArea,
      growthStage,
      currentHealthStatus,
      yieldEstimate,
      notes,
      farm,
    } = req.body;

    if (name) crop.name = name;
    if (variety !== undefined) crop.variety = variety;
    if (category) crop.category = category;
    if (plantingDate) crop.plantingDate = plantingDate;
    if (expectedHarvestDate) crop.expectedHarvestDate = expectedHarvestDate;
    if (allocatedArea !== undefined) crop.allocatedArea = parseFloat(allocatedArea);
    if (growthStage) crop.growthStage = growthStage;
    if (currentHealthStatus) crop.currentHealthStatus = currentHealthStatus;
    if (yieldEstimate) crop.yieldEstimate = yieldEstimate;
    if (notes !== undefined) crop.notes = notes;
    if (farm) crop.farm = farm;

    const updatedCrop = await crop.save();
    const populated = await Crop.findById(updatedCrop._id).populate("farm", "name location");

    res.json({
      success: true,
      message: "Crop updated successfully",
      crop: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete crop
// @route   DELETE /api/crops/:id
// @access  Private
const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    await crop.deleteOne();
    res.json({
      success: true,
      message: "Crop record removed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
};

