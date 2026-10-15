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
  Paddy: {
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
  Clay: 0.9,     // High water holding capacity, slower infiltration
  Black: 0.9,    // High swelling and water retention
  Alluvial: 1.0, // Standard balanced texture
  Loamy: 1.0,    // Optimal soil texture
  Silt: 0.95,    // Moderate-high retention
  Red: 1.1,      // Moderate drainage
  Sandy: 1.25,   // Rapid drainage, requires more frequent lighter irrigation
};

// Physical conversion constant: 1 mm depth over 1 acre = 4,046.86 Liters
const LITERS_PER_MM_PER_ACRE = 4046.86;

/**
 * Normalize crop name to match standard Kc factor table
 */
const normalizeCropKey = (name) => {
  const lower = String(name || "").toLowerCase().trim();
  if (lower.includes("paddy") || lower.includes("rice")) return "Rice";
  if (lower.includes("maize") || lower.includes("corn")) return "Maize";
  if (lower.includes("wheat")) return "Wheat";
  if (lower.includes("tomato")) return "Tomato";
  if (lower.includes("cotton")) return "Cotton";
  if (lower.includes("potato")) return "Potato";
  if (lower.includes("soybean") || lower.includes("soyabean")) return "Soybean";
  return "Default";
};

/**
 * Calculate effective rainfall (Pe) from total forecast precipitation
 * Light rain (<5mm) mostly evaporates; moderate rain infiltrates root zone; heavy rain creates runoff.
 */
const calculateEffectiveRainfall = (forecastRainMm) => {
  const p = Math.max(0, Number(forecastRainMm) || 0);
  if (p <= 0) return 0;
  // Light showers (< 5mm) have high canopy interception and topsoil evaporation loss
  if (p <= 5) return Number((p * 0.25).toFixed(2));
  // Moderate rain (5-20mm) contributes well to root zone
  if (p <= 20) return Number((1.25 + (p - 5) * 0.45).toFixed(2));
  // Heavy rain (> 20mm): runoff increases, effective soil absorption saturates at 12mm/day
  return Number(Math.min(12, 8.0 + (p - 20) * 0.2).toFixed(2));
};

/**
 * Calculate net irrigation requirement
 * @param {Object} crop - Crop document with name, growthStage, allocatedArea
 * @param {Object} farm - Farm document with soilType, totalArea
 * @param {Object} weather - Current and forecast weather
 */
function calculateWaterRequirement(crop, farm = {}, weather = {}) {
  const cropKey = normalizeCropKey(crop.name);
  const cropFactors = CROP_KC_FACTORS[cropKey] || CROP_KC_FACTORS.Default;
  const stage = String(crop.growthStage || "Vegetative").trim();
  const kc = cropFactors[stage] ?? cropFactors.Vegetative ?? 0.8;

  // Temperature & Humidity from weather
  const temp = Number(weather.current?.temperature ?? 28);
  const humidity = Number(weather.current?.humidity ?? 60);

  // FAO Hargreaves / radiation modified approximation for daily reference ET0 (mm/day)
  const tempFactor = (temp + 15) / 10;
  const humidityFactor = Math.max(0.65, (100 - humidity * 0.5) / 70);
  let eto = Number((tempFactor * humidityFactor).toFixed(2));
  eto = Math.max(3.5, Math.min(eto, 7.5)); // agronomic range 3.5 to 7.5 mm/day

  // Crop water demand (ETc in mm/day) = ETo * Kc * soilFactor
  const soilType = farm.soilType || "Loamy";
  const soilFactor = SOIL_RETENTION_FACTORS[soilType] || 1.0;
  const dailyCropWaterMm = Number((eto * kc * soilFactor).toFixed(2));

  // Precipitation & Effective Rainfall
  const forecastRainMm = Math.max(0, Number(weather.forecast?.[0]?.precipitationSum ?? 0));
  const effectiveRainfallMm = calculateEffectiveRainfall(forecastRainMm);

  // Net irrigation requirement: ETc - Peff (prevent negative)
  let netWaterRequirementMm = Math.max(0, dailyCropWaterMm - effectiveRainfallMm);

  // Irrigation schedule decision
  let recommendationStatus = "Irrigate Today";
  let reason = `Normal irrigation cycle for ${stage} stage (${dailyCropWaterMm} mm/day requirement).`;

  if (forecastRainMm >= 25 || effectiveRainfallMm >= dailyCropWaterMm * 1.5) {
    recommendationStatus = "Skip Irrigation";
    reason = `Substantial rainfall (${forecastRainMm} mm) forecasted today. Natural precipitation will adequately recharge root zone.`;
    netWaterRequirementMm = 0;
  } else if (forecastRainMm >= 5) {
    recommendationStatus = "Reduce Water Volume";
    reason = `Rainfall (${forecastRainMm} mm) predicted. Lowered irrigation to prevent waterlogging.`;
    // Ensure net requirement is reasonably reduced but not wiped out if crop needs water
    netWaterRequirementMm = Math.max(1.0, Math.round(netWaterRequirementMm * 10) / 10);
  } else if (temp >= 36) {
    recommendationStatus = "Urgent Irrigation";
    reason = `High heat index (${temp}°C) accelerates transpiration. Water early morning to prevent wilting.`;
  }

  // Physical conversion: 1 mm over 1 acre = 4046.86 Liters
  const allocatedAcres = Number(crop.allocatedArea || farm.totalArea || 1);
  const totalWaterLiters = Math.round(netWaterRequirementMm * LITERS_PER_MM_PER_ACRE * allocatedAcres);
  const grossWaterLiters = Math.round(dailyCropWaterMm * LITERS_PER_MM_PER_ACRE * allocatedAcres);

  return {
    cropName: crop.name,
    growthStage: stage,
    cropFactorKc: kc,
    referenceEtoMm: eto,
    dailyCropWaterMm,
    forecastRainMm,
    effectiveRainfallMm,
    netWaterRequirementMm: Number(netWaterRequirementMm.toFixed(1)),
    allocatedAcres,
    totalWaterLiters,
    grossWaterLiters,
    recommendationStatus,
    reason,
    soilType,
  };
}

module.exports = {
  calculateWaterRequirement,
  calculateEffectiveRainfall,
  normalizeCropKey,
  CROP_KC_FACTORS,
  SOIL_RETENTION_FACTORS,
  LITERS_PER_MM_PER_ACRE,
};
