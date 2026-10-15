/**
 * AI / Rule-Based Agricultural Recommendation Engine
 * Synthesizes: Weather, Crop Growth Stage, Health Diagnostics,
 * Soil Characteristics, Irrigation Schedules, and Market Prices.
 * Architecture is designed as a modular pipeline for easy ML model plug-in.
 */

const generateRecommendations = ({
  user = {},
  farms = [],
  crops = [],
  weather = {},
  healthLogs = [],
  marketPrices = [],
}) => {
  const recommendations = [];

  const currentWeather = weather.current || {};
  const forecast = weather.forecast || [];
  const temp = currentWeather.temperature || 28;
  const humidity = currentWeather.humidity || 60;
  const windSpeed = currentWeather.windSpeed || 12;
  const next24hRain = forecast[0]?.precipitationSum || 0;

  // 1. WEATHER & CLIMATIC HAZARD RULES
  if (next24hRain >= 15) {
    recommendations.push({
      id: "rec_weather_heavy_rain",
      title: "Heavy Rainfall Alert: Pause Irrigation & Clear Drainage",
      category: "Weather",
      priority: "High",
      impact: "Prevents root rot and waterlogging in low-lying plots",
      description: `Meteorological models forecast ${next24hRain}mm of rainfall over the next 24-48 hours.`,
      action: "Suspend automated pump runs. Inspect field perimeter furrows to ensure stormwater drains freely.",
    });
  }

  if (temp >= 36) {
    recommendations.push({
      id: "rec_weather_heatwave",
      title: "Heat Stress Advisory: Afternoon Evaporative Protection",
      category: "Weather",
      priority: "High",
      impact: "Protects pollen viability and minimizes flower drop",
      description: `Ambient temperature has reached ${temp}°C, causing extreme vapor pressure deficit.`,
      action: "Irrigate during pre-dawn or twilight hours. Consider applying organic straw mulching to conserve topsoil moisture.",
    });
  }

  if (windSpeed > 20) {
    recommendations.push({
      id: "rec_weather_wind_drift",
      title: "High Wind Alert: Postpone Agrochemical Spraying",
      category: "Weather",
      priority: "Medium",
      impact: "Eliminates chemical drift and saves chemical costs",
      description: `Wind gusts currently measure ${windSpeed} km/h, well above the 15 km/h safety threshold for foliar applications.`,
      action: "Reschedule insecticide and foliar fertilizer sprays until early morning when air is calmer.",
    });
  }

  if (humidity >= 80 && temp >= 24) {
    recommendations.push({
      id: "rec_weather_fungal_alert",
      title: "Fungal Micro-Climate Alert: Preventive Scouting",
      category: "Crop Health",
      priority: "Medium",
      impact: "Early detection prevents full-field pathogen outbreaks",
      description: `Sustained high humidity (${humidity}%) alongside warm temperatures creates prime conditions for foliar blight and downy mildew.`,
      action: "Inspect lower crop canopies for water-soaked spots. Prepare bio-fungicide (Trichoderma viride or neem formulation) if symptoms develop.",
    });
  }

  // 2. CROP LIFECYCLE & STAGE-SPECIFIC RECOMMENDATIONS
  crops.forEach((crop) => {
    const stage = crop.growthStage;
    const cropFarm = farms.find((f) => f._id.toString() === crop.farm?.toString()) || {};
    const farmName = cropFarm.name || "Main Field";

    if (stage === "Vegetative") {
      recommendations.push({
        id: `rec_crop_veg_${crop._id}`,
        title: `${crop.name}: Rapid Vegetative Stage Nutrient Boost`,
        category: "Fertilization",
        priority: "Medium",
        cropName: crop.name,
        farmName,
        impact: "Promotes vigorous tillering and leaf area index",
        description: `${crop.name} at ${farmName} is in its critical vegetative biomass accumulation phase.`,
        action: "Apply balanced Nitrogen-Phosphorus top dressing (or well-rotted vermicompost) alongside regular soil hoeing.",
      });
    } else if (stage === "Flowering") {
      recommendations.push({
        id: `rec_crop_flower_${crop._id}`,
        title: `${crop.name}: Sensitive Flowering Phase Water Management`,
        category: "Irrigation",
        priority: "High",
        cropName: crop.name,
        farmName,
        impact: "Maximizes pollination success and prevents premature blossom drop",
        description: `Flowering is the most drought-vulnerable phenological stage for ${crop.name}.`,
        action: "Maintain steady, uniform soil moisture. Avoid severe water deficits or prolonged flooding during this 10-day window.",
      });
    } else if (stage === "Fruiting / Grain Filling") {
      recommendations.push({
        id: `rec_crop_fruit_${crop._id}`,
        title: `${crop.name}: Grain Filling & Micronutrient Fortification`,
        category: "Fertilization",
        priority: "Medium",
        cropName: crop.name,
        farmName,
        impact: "Enhances test weight, kernel density, and market grade",
        description: `Carbohydrates are actively translocating from leaves to developing grain/fruit.`,
        action: "Apply Potassium-rich soluble foliar spray (0:0:50 SOP) to improve fruit size and disease resistance.",
      });
    } else if (stage === "Ripening / Maturation") {
      recommendations.push({
        id: `rec_crop_ripen_${crop._id}`,
        title: `${crop.name}: Pre-Harvest Moisture Tapering`,
        category: "Harvest",
        priority: "High",
        cropName: crop.name,
        farmName,
        impact: "Prevents grain lodging and accelerates natural moisture dry-down",
        description: `${crop.name} is approaching physiological maturity.`,
        action: "Terminate field irrigation 10 to 14 days before intended harvest. Check grain moisture content target (12-14%).",
      });
    }

    // 3. UNRESOLVED CROP HEALTH LOGS
    const activeCropLogs = healthLogs.filter(
      (log) => !log.resolved && (log.crop?._id?.toString() === crop._id?.toString() || log.crop?.toString() === crop._id?.toString())
    );

    activeCropLogs.forEach((log) => {
      recommendations.push({
        id: `rec_health_${log._id}`,
        title: `Active Issue on ${crop.name}: ${log.diagnosis}`,
        category: "Crop Health",
        priority: log.severity === "High" ? "High" : "Medium",
        cropName: crop.name,
        farmName,
        impact: "Arrests pest spread and mitigates potential yield reduction",
        description: `Symptoms reported: ${log.symptoms?.join(", ") || "Visual stress observed"}. Severity level: ${log.severity}.`,
        action: log.suggestedActions?.[0] || "Consult agronomist or apply targeted organic bio-pesticide spray immediately.",
      });
    });
  });

  // 4. SOIL-SPECIFIC RULES
  farms.forEach((farm) => {
    if (farm.soilPh && (farm.soilPh < 6.0 || farm.soilPh > 8.0)) {
      const isAcidic = farm.soilPh < 6.0;
      recommendations.push({
        id: `rec_soil_${farm._id}`,
        title: `Soil pH Correction Needed for ${farm.name} (pH: ${farm.soilPh})`,
        category: "Fertilization",
        priority: "Medium",
        farmName: farm.name,
        impact: "Restores nutrient uptake efficiency by up to 25%",
        description: isAcidic
          ? `Soil pH (${farm.soilPh}) is too acidic, locking phosphorus and trace minerals.`
          : `Soil pH (${farm.soilPh}) is alkaline, reducing iron and zinc availability.`,
        action: isAcidic
          ? "Apply agricultural limestone or dolomite at 200 kg/acre."
          : "Apply agricultural gypsum or elemental sulfur alongside high-organic-matter manure.",
      });
    }
  });

  // 5. MARKET TIMING & COMMODITY TREND RULES
  marketPrices.forEach((mp) => {
    const matchingCrop = crops.find(
      (c) =>
        c.name.toLowerCase().includes(mp.cropName.toLowerCase()) ||
        mp.cropName.toLowerCase().includes(c.name.toLowerCase())
    );

    if (matchingCrop) {
      if (mp.trend === "up" && (matchingCrop.growthStage === "Ripening / Maturation" || matchingCrop.growthStage === "Harvested")) {
        recommendations.push({
          id: `rec_market_sell_${mp._id}`,
          title: `Market Opportunity: ${mp.cropName} Prices Up (+${mp.priceChangePercent}%)`,
          category: "Market",
          priority: "High",
          cropName: matchingCrop.name,
          impact: `Capture peak pricing of ${mp.unit} ${mp.currentPrice} at ${mp.marketName}`,
          description: `Wholesale rates have strengthened. Mandi demand is categorized as ${mp.demandLevel}.`,
          action: "Schedule harvest dispatch and arrange mandi logistics within 48 to 72 hours to lock in premium rates.",
        });
      } else if (mp.trend === "down" && matchingCrop.growthStage === "Ripening / Maturation") {
        recommendations.push({
          id: `rec_market_hold_${mp._id}`,
          title: `Market Caution: ${mp.cropName} Prices Softening (${mp.priceChangePercent}%)`,
          category: "Market",
          priority: "Medium",
          cropName: matchingCrop.name,
          impact: "Avoids selling at temporary seasonal glut discount",
          description: `Current rate is ${mp.unit} ${mp.currentPrice} at ${mp.marketName}.`,
          action: "If airtight grain storage or warehouse receipt finance is available, hold produce for 2-3 weeks for price recovery.",
        });
      }
    }
  });

  // If few recommendations, provide standard high-yield operational practices
  if (recommendations.length === 0) {
    recommendations.push({
      id: "rec_default_optimal",
      title: "All Farm Systems Optimal: Maintain Scheduled Operations",
      category: "General",
      priority: "Low",
      impact: "Ensures continued healthy crop stand and steady growth",
      description: "Weather, soil conditions, and active crops are performing within ideal agronomic parameters.",
      action: "Continue routine morning field inspections, maintain irrigation telemetry, and log any pest sightings.",
    });
  }

  // Sort by priority (High -> Medium -> Low)
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  return recommendations.sort(
    (a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1)
  );
};

module.exports = {
  generateRecommendations,
};

