/**
 * Agricultural Irrigation Computation Engine
 * Based on FAO-56 Crop Evapotranspiration & Soil Water Balance
 */

// Crop coefficients (Kc) mapped by crop category and growth stage
const CROP_KC_FACTORS = {
  Wheat: {
    Germination: 0.4,
    Vegetative: 0.75,
    Flowering: 1.15,
    "Fruiting / Grain Filling": 1.1,
    "Ripening / Maturation": 0.65,
    Harvested: 0.0,
  },
  Rice: {
    Germination: 1.05,
    Vegetative: 1.15,
    Flowering: 1.25,
    "Fruiting / Grain Filling": 1.2,
    "Ripening / Maturation": 0.9,
    Harvested: 0.0,
  },
  Maize: {
    Germination: 0.4,
    Vegetative: 0.8,
    Flowering: 1.2,
    "Fruiting / Grain Filling": 1.15,
    "Ripening / Maturation": 0.6,
    Harvested: 0.0,
  },
  Tomato: {
    Germination: 0.5,
    Vegetative: 0.75,
    Flowering: 1.05,
    "Fruiting / Grain Filling": 1.15,
    "Ripening / Maturation": 0.8,
    Harvested: 0.0,
  },
  Cotton: {
    Germination: 0.45,
    Vegetative: 0.75,
    Flowering: 1.2,
    "Fruiting / Grain Filling": 1.15,
    "Ripening / Maturation": 0.65,
    Harvested: 0.0,
  },
  Potato: {
    Germination: 0.45,
    Vegetative: 0.75,
    Flowering: 1.15,
    "Fruiting / Grain Filling": 1.1,
    "Ripening / Maturation": 0.75,
    Harvested: 0.0,
  },
  Soybean: {
    Germination: 0.4,
    Vegetative: 0.8,
    Flowering: 1.15,
    "Fruiting / Grain Filling": 1.1,
    "Ripening / Maturation": 0.5,
    Harvested: 0.0,
  },
  Default: {
    Germination: 0.45,
    Vegetative: 0.8,
    Flowering: 1.15,
    "Fruiting / Grain Filling": 1.1,
    "Ripening / Maturation": 0.7,
    Harvested: 0.0,
  },
};

// Soil water holding and infiltration adjustment multipliers
const SOIL_RETENTION_FACTORS = {
  Clay: 0.85,    // High water holding capacity, irrigations can be less frequent
  Black: 0.85,   // Heavy montmorillonite clay, high swelling and water retention
  Alluvial: 1.0, // Standard balanced texture
  Loamy: 1.0,    // Optimal soil texture
  Silt: 0.95,    // Moderate-high retention
  Red: 1.1,      // Moderate drainage
  Sandy: 1.25,   // Rapid drainage, requires more frequent lighter irrigation
};

/**
 * Calculate net irrigation requirement
 * @param {Object} crop - Crop document
 * @param {Object} farm - Farm document with soil & area info
 * @param {Object} weather - Current and forecast weather
 */
function calculateWaterRequirement(crop, farm, weather = {}) {
  const cropNameKey = Object.keys(CROP_KC_FACTORS).find((key) =>
    crop.name.toLowerCase().includes(key.toLowerCase())
  );
  const cropFactors = cropNameKey ? CROP_KC_FACTORS[cropNameKey] : CROP_KC_FACTORS.Default;
  const stage = crop.growthStage || "Vegetative";
  const kc = cropFactors[stage] || 0.8;

  // Estimate reference evapotranspiration (ETo in mm/day) from temp & humidity
  const temp = weather.current?.temperature || 28;
  const humidity = weather.current?.humidity || 60;
  // Hargreaves / modified formula approximation for daily reference ET
  let eto = (0.0023 * (temp + 17.8) * Math.sqrt(Math.max(1, 100 - humidity)) * 0.4).toFixed(2);
  eto = Math.max(3.0, Math.min(eto, 8.5)); // clamp reasonable agronomic range (3 to 8.5 mm/day)

  // Crop water demand (mm) = Kc * ETo
  const soilFactor = SOIL_RETENTION_FACTORS[farm.soilType] || 1.0;
  let dailyCropWaterMm = parseFloat((eto * kc * soilFactor).toFixed(2));

  // Upcoming precipitation consideration
  const upcomingRainMm = weather.forecast?.[0]?.precipitationSum || 0;
  let netWaterRequirementMm = Math.max(0, dailyCropWaterMm - upcomingRainMm * 0.7);

  // Irrigation schedule decision
  let recommendationStatus = "Irrigate Today";
  let reason = `Normal irrigation cycle for ${stage} stage.`;

  if (upcomingRainMm >= 15) {
    recommendationStatus = "Skip Irrigation";
    reason = `Substantial rainfall (${upcomingRainMm}mm) forecasted today. Natural precipitation will adequately recharge root zone.`;
    netWaterRequirementMm = 0;
  } else if (upcomingRainMm >= 5) {
    recommendationStatus = "Reduce Water Volume";
    reason = `Light rain (${upcomingRainMm}mm) predicted. Lowered irrigation to prevent waterlogging.`;
  } else if (temp >= 36) {
    recommendationStatus = "Urgent Irrigation";
    reason = `High heat index (${temp}°C) accelerates transpiration. Water early morning to prevent wilting.`;
  }

  // Convert mm to liters: 1 mm over 1 acre = 4046.86 Liters
  const allocatedAcres = crop.allocatedArea || farm.totalArea || 1;
  const totalLiters = Math.round(netWaterRequirementMm * 4047 * allocatedAcres);

  return {
    cropName: crop.name,
    growthStage: stage,
    cropFactorKc: kc,
    referenceEtoMm: parseFloat(eto),
    dailyCropWaterMm,
    forecastRainMm: upcomingRainMm,
    netWaterRequirementMm: parseFloat(netWaterRequirementMm.toFixed(1)),
    allocatedAcres,
    totalWaterLiters: totalLiters,
    recommendationStatus,
    reason,
    soilType: farm.soilType,
  };
}

module.exports = {
  calculateWaterRequirement,
  CROP_KC_FACTORS,
  SOIL_RETENTION_FACTORS,
};

