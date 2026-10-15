const HealthLog = require("../models/HealthLog");
const Crop = require("../models/Crop");
const Farm = require("../models/Farm");

// Comprehensive agricultural diagnostic knowledge base
const DIAGNOSTIC_LIBRARY = [
  {
    category: "Fungal",
    diagnosis: "Early / Late Blight",
    symptoms: ["Dark brown concentric spots on leaves", "Water-soaked lesions", "Leaf withering"],
    suggestedActions: [
      "Spray Mancozeb (2.5g/L) or Copper Oxychloride at first sign.",
      "Organic: Apply Trichoderma viride culture and prune infected lower foliage.",
      "Avoid overhead sprinkler irrigation to reduce leaf wetness duration.",
    ],
    severity: "High",
  },
  {
    category: "Fungal",
    diagnosis: "Powdery Mildew",
    symptoms: ["White talcum-like powder coating on leaf surface", "Curling foliage", "Premature leaf drop"],
    suggestedActions: [
      "Spray wettable sulfur (2g/L) or hexaconazole (1ml/L).",
      "Organic: Spray diluted milk-water solution (1:9 ratio) or potassium bicarbonate.",
      "Thin out crowded plant canopy to improve air circulation.",
    ],
    severity: "Medium",
  },
  {
    category: "Pest",
    diagnosis: "Aphid / Whitefly Infestation",
    symptoms: ["Curled sticky leaves", "Yellowing foliage", "Sooty black mold growth", "Stunted growth"],
    suggestedActions: [
      "Spray Neem Seed Kernel Extract (5%) or Neem Oil (3ml/L with mild soap).",
      "Chemical option: Imidacloprid 17.8 SL (0.5ml/L) if threshold exceeds 20 aphids/leaf.",
      "Install yellow sticky traps across field at canopy height.",
    ],
    severity: "Medium",
  },
  {
    category: "Pest",
    diagnosis: "Stem Borer / Armyworm Attack",
    symptoms: ["Dead heart in central shoots", "Irregular chewed holes on leaves", "Frass/droppings inside stems"],
    suggestedActions: [
      "Apply Bacillus thuringiensis (Bt) spray or Chlorantraniliprole (0.4ml/L).",
      "Organic: Install pheromone traps (5 traps/acre) to monitor and catch adult moths.",
      "Release Trichogramma egg parasitoid cards.",
    ],
    severity: "High",
  },
  {
    category: "Nutrient",
    diagnosis: "Nitrogen (N) Deficiency",
    symptoms: ["General pale yellowing starting on older bottom leaves", "Stunted vegetative growth"],
    suggestedActions: [
      "Top-dress with Urea (25-30 kg/acre) prior to light irrigation.",
      "Organic: Apply enriched compost tea or neem cake blended farmyard manure.",
      "Foliar spray with 1% Urea solution for rapid greening.",
    ],
    severity: "Medium",
  },
  {
    category: "Nutrient",
    diagnosis: "Iron / Zinc Micronutrient Chlorosis",
    symptoms: ["Interveinal yellowing on new emerging leaves while veins remain green"],
    suggestedActions: [
      "Foliar spray of Chelated Zinc (1.5g/L) or Ferrous Sulfate (2g/L) with citric acid.",
      "Correct alkaline soil pH by applying agricultural gypsum.",
    ],
    severity: "Low",
  },
  {
    category: "Abiotic",
    diagnosis: "Moisture Stress (Drought / Waterlogging)",
    symptoms: ["Temporary daytime wilting", "Leaf tip scorch", "Yellowing of lower leaves due to suffocation"],
    suggestedActions: [
      "If drought: Schedule immediate deep irrigation and apply straw mulch.",
      "If waterlogged: Dig drainage furrows immediately and aerate surface crust once dry.",
    ],
    severity: "High",
  },
];

// @desc    Get all health logs
// @route   GET /api/health
// @access  Private
const getHealthLogs = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.crop) filter.crop = req.query.crop;
    if (req.query.farm) filter.farm = req.query.farm;
    if (req.query.resolved !== undefined) filter.resolved = req.query.resolved === "true";

    const logs = await HealthLog.find(filter)
      .populate("crop", "name variety growthStage currentHealthStatus")
      .populate("farm", "name location")
      .sort({ date: -1 });

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log a new health observation
// @route   POST /api/health
// @access  Private
const addHealthLog = async (req, res) => {
  try {
    const { crop, farm, date, status, symptoms, diagnosis, severity, suggestedActions, notes } =
      req.body;

    if (!crop || !farm) {
      return res.status(400).json({
        success: false,
        message: "Please select both a crop and a farm",
      });
    }

    // Auto-match symptoms against diagnostic library if suggested actions not provided
    let finalDiagnosis = diagnosis || "Health Inspection";
    let finalActions = suggestedActions && suggestedActions.length > 0 ? suggestedActions : [];
    let finalSeverity = severity || "Medium";

    if (symptoms && symptoms.length > 0 && finalActions.length === 0) {
      const match = DIAGNOSTIC_LIBRARY.find((item) =>
        item.symptoms.some((s) =>
          symptoms.some((inputSym) => s.toLowerCase().includes(inputSym.toLowerCase()))
        )
      );
      if (match) {
        if (!diagnosis) finalDiagnosis = match.diagnosis;
        finalActions = match.suggestedActions;
        if (!severity) finalSeverity = match.severity;
      }
    }

    const log = await HealthLog.create({
      user: req.user._id,
      crop,
      farm,
      date: date || Date.now(),
      status: status || "Moderate Risk",
      symptoms: symptoms || [],
      diagnosis: finalDiagnosis,
      severity: finalSeverity,
      suggestedActions: finalActions,
      notes: notes || "",
    });

    // Update crop currentHealthStatus to reflect latest condition
    if (status) {
      await Crop.findByIdAndUpdate(crop, { currentHealthStatus: status });
    }

    const populatedLog = await HealthLog.findById(log._id)
      .populate("crop", "name variety growthStage")
      .populate("farm", "name location");

    res.status(201).json({
      success: true,
      message: "Health observation logged successfully",
      log: populatedLog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a health issue as resolved
// @route   PATCH /api/health/:id/resolve
// @access  Private
const resolveHealthLog = async (req, res) => {
  try {
    const log = await HealthLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: "Health log not found" });
    }

    log.resolved = !log.resolved;
    log.resolvedDate = log.resolved ? new Date() : null;
    await log.save();

    // Check if there are other open unresolved logs for this crop
    const otherUnresolved = await HealthLog.countDocuments({
      crop: log.crop,
      resolved: false,
    });

    if (otherUnresolved === 0) {
      await Crop.findByIdAndUpdate(log.crop, { currentHealthStatus: "Healthy" });
    }

    res.json({
      success: true,
      message: log.resolved ? "Health observation marked as resolved" : "Health observation reopened",
      log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a health log
// @route   DELETE /api/health/:id
// @access  Private
const deleteHealthLog = async (req, res) => {
  try {
    const log = await HealthLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: "Health log not found" });
    }

    await log.deleteOne();
    res.json({ success: true, message: "Health observation record deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get agricultural diagnostic library reference
// @route   GET /api/health/diagnostics-library
// @access  Private
const getDiagnosticsLibrary = (req, res) => {
  res.json({
    success: true,
    library: DIAGNOSTIC_LIBRARY,
  });
};

module.exports = {
  getHealthLogs,
  addHealthLog,
  resolveHealthLog,
  deleteHealthLog,
  getDiagnosticsLibrary,
};

