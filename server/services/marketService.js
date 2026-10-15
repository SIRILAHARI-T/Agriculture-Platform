const MarketPrice = require("../models/MarketPrice");

const DATA_GOV_RESOURCE_ID = "35985678-0d79-46b4-9ed6-6f13308a1d24";
const REQUEST_TIMEOUT = 25000;

// ======================================================
// CROP TO API COMMODITY MAPPING
// ======================================================

const CROP_TO_API_COMMODITIES = {
  Paddy: ["Paddy(Dhan)(Common)", "Paddy(Dhan)(Basmati)", "Rice"],
  Rice: ["Paddy(Dhan)(Common)", "Paddy(Dhan)(Basmati)", "Rice"],
  "Paddy (Rice)": ["Paddy(Dhan)(Common)", "Paddy(Dhan)(Basmati)", "Rice"],
  "Basmati Rice": ["Paddy(Dhan)(Basmati)", "Rice"],
  Maize: ["Maize"],
  Corn: ["Maize"],
  Wheat: ["Wheat"],
  Tomato: ["Tomato"],
  Potato: ["Potato"],
  Cotton: ["Cotton"],
  Bajra: ["Bajra(Pearl Millet/Cumbu)"],
  Ragi: ["Ragi (Finger Millet)"],
  Jowar: ["Jowar(Sorghum)"],
  Groundnut: ["Ground Nut Seed", "Groundnut"],
  Mustard: ["Mustard"],
  Sunflower: ["Sunflower"],
  Soyabean: ["Soyabean"],
  Soybean: ["Soyabean"],
  Turmeric: ["Turmeric", "Turmeric (raw)"],
  Onion: ["Onion"],
};

// ======================================================
// CATEGORY DETECTION HELPER
// ======================================================

const getCategoryForCrop = (cropName) => {
  const lower = String(cropName || "").toLowerCase();
  if (
    lower.includes("paddy") ||
    lower.includes("rice") ||
    lower.includes("wheat") ||
    lower.includes("maize") ||
    lower.includes("corn") ||
    lower.includes("bajra") ||
    lower.includes("ragi") ||
    lower.includes("jowar") ||
    lower.includes("barley")
  ) {
    return "Cereal";
  }
  if (
    lower.includes("tomato") ||
    lower.includes("potato") ||
    lower.includes("onion") ||
    lower.includes("cabbage") ||
    lower.includes("cauliflower") ||
    lower.includes("brinjal") ||
    lower.includes("chilli")
  ) {
    return "Vegetable";
  }
  if (
    lower.includes("cotton") ||
    lower.includes("sugarcane") ||
    lower.includes("tobacco") ||
    lower.includes("jute")
  ) {
    return "Cash Crop";
  }
  if (
    lower.includes("groundnut") ||
    lower.includes("mustard") ||
    lower.includes("sunflower") ||
    lower.includes("soyabean") ||
    lower.includes("soybean") ||
    lower.includes("sesame")
  ) {
    return "Oilseed";
  }
  return "Cereal";
};

// Normalize API commodity to farmer standard crop name
const normalizeCropName = (commodityName, requestedCropName) => {
  const comm = String(commodityName || "").trim();
  if (/paddy|dhan/i.test(comm)) {
    return "Paddy";
  }
  if (/^rice$/i.test(comm)) {
    return requestedCropName && /paddy/i.test(requestedCropName) ? "Paddy" : "Rice";
  }
  if (/maize|corn/i.test(comm)) {
    return "Maize";
  }
  return requestedCropName || comm;
};

// ======================================================
// DATE PARSER HELPER (DD/MM/YYYY -> YYYY-MM-DD)
// ======================================================

const parseArrivalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return getToday();
  const parts = dateStr.trim().split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // DD/MM/YYYY
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      const year = parts[0];
      const month = parts[1].padStart(2, "0");
      const day = parts[2].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return getToday();
};

// ======================================================
// DEFAULT MARKET DATA (MULTI-POINT HISTORIES)
// ======================================================

const DEFAULT_COMMODITIES = [
  {
    cropName: "Wheat",
    category: "Cereal",
    marketName: "Ludhiana Mandi",
    state: "Punjab",
    district: "Ludhiana",
    variety: "Wheat",
    currentPrice: 24,
    previousPrice: 23,
    minPrice: 22,
    maxPrice: 26,
    unit: "₹/Kg",
    demandLevel: "High",
    recommendation: "Good demand. Compare nearby markets before selling.",
    history: [
      { date: "2026-10-01", price: 22.5 },
      { date: "2026-10-04", price: 22.8 },
      { date: "2026-10-07", price: 23.0 },
      { date: "2026-10-10", price: 23.2 },
      { date: "2026-10-12", price: 23.0 },
      { date: "2026-10-15", price: 24.0 },
    ],
  },
  {
    cropName: "Rice",
    category: "Cereal",
    marketName: "Amritsar Mandi",
    state: "Punjab",
    district: "Amritsar",
    variety: "Basmati",
    currentPrice: 42,
    previousPrice: 40,
    minPrice: 39,
    maxPrice: 45,
    unit: "₹/Kg",
    demandLevel: "High",
    recommendation: "Demand is strong. Consider monitoring prices before selling.",
    history: [
      { date: "2026-10-01", price: 39.5 },
      { date: "2026-10-04", price: 40.0 },
      { date: "2026-10-07", price: 40.5 },
      { date: "2026-10-10", price: 41.0 },
      { date: "2026-10-13", price: 40.0 },
      { date: "2026-10-15", price: 42.0 },
    ],
  },
  {
    cropName: "Tomato",
    category: "Vegetable",
    marketName: "Nashik Market",
    state: "Maharashtra",
    district: "Nashik",
    variety: "Hybrid",
    currentPrice: 32,
    previousPrice: 35,
    minPrice: 28,
    maxPrice: 36,
    unit: "₹/Kg",
    demandLevel: "Moderate",
    recommendation: "Prices are fluctuating. Compare nearby markets before selling.",
    history: [
      { date: "2026-10-01", price: 36.0 },
      { date: "2026-10-04", price: 37.0 },
      { date: "2026-10-07", price: 35.0 },
      { date: "2026-10-10", price: 34.0 },
      { date: "2026-10-13", price: 35.0 },
      { date: "2026-10-15", price: 32.0 },
    ],
  },
  {
    cropName: "Potato",
    category: "Vegetable",
    marketName: "Nashik Market",
    state: "Maharashtra",
    district: "Nashik",
    variety: "Kufri Jyoti",
    currentPrice: 22,
    previousPrice: 21,
    minPrice: 19,
    maxPrice: 24,
    unit: "₹/Kg",
    demandLevel: "Moderate",
    recommendation: "Stable demand. Monitor prices for better selling opportunities.",
    history: [
      { date: "2026-10-01", price: 20.0 },
      { date: "2026-10-04", price: 20.5 },
      { date: "2026-10-07", price: 21.0 },
      { date: "2026-10-10", price: 21.0 },
      { date: "2026-10-13", price: 21.0 },
      { date: "2026-10-15", price: 22.0 },
    ],
  },
  {
    cropName: "Cotton",
    category: "Cash Crop",
    marketName: "Kurnool Market",
    state: "Andhra Pradesh",
    district: "Kurnool",
    variety: "Bt Cotton",
    currentPrice: 68,
    previousPrice: 66,
    minPrice: 64,
    maxPrice: 72,
    unit: "₹/Kg",
    demandLevel: "High",
    recommendation: "Demand is strong. Compare market prices before selling.",
    history: [
      { date: "2026-10-01", price: 65.0 },
      { date: "2026-10-04", price: 65.5 },
      { date: "2026-10-07", price: 66.0 },
      { date: "2026-10-10", price: 67.0 },
      { date: "2026-10-13", price: 66.0 },
      { date: "2026-10-15", price: 68.0 },
    ],
  },
];

// ======================================================
// PRICE HELPERS
// ======================================================

const parsePrice = (value) => {
  if (typeof value === "string") {
    value = value.replace(/,/g, "").trim();
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const calculatePriceChange = (previousPrice, currentPrice) => {
  if (previousPrice <= 0) return 0;
  return Number((((currentPrice - previousPrice) / previousPrice) * 100).toFixed(2));
};

const calculateTrend = (previousPrice, currentPrice) => {
  if (currentPrice > previousPrice) return "up";
  if (currentPrice < previousPrice) return "down";
  return "stable";
};

const getToday = () => new Date().toISOString().split("T")[0];

const quintalToKg = (value) => {
  const number = parsePrice(value);
  if (number <= 0) return 0;
  return Number((number / 100).toFixed(2));
};

// ======================================================
// ENSURE DEFAULT MARKET DATA EXISTS
// ======================================================

const ensureMarketSeed = async () => {
  try {
    const count = await MarketPrice.countDocuments();
    if (count > 0) {
      console.log(`Market data already exists (${count} records).`);
      return;
    }

    console.log("No market data found. Creating default market data...");
    const marketItems = DEFAULT_COMMODITIES.map((item) => {
      const priceChangePercent = calculatePriceChange(item.previousPrice, item.currentPrice);
      const trend = calculateTrend(item.previousPrice, item.currentPrice);
      return {
        ...item,
        priceChangePercent,
        trend,
      };
    });

    await MarketPrice.insertMany(marketItems);
    console.log(`Created ${marketItems.length} default market records.`);
  } catch (error) {
    console.error("Failed to ensure market seed:", error.message);
    throw error;
  }
};

// ======================================================
// FETCH JSON WITH TIMEOUT
// ======================================================

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`data.gov.in returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Government market API timed out after ${REQUEST_TIMEOUT / 1000} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

// ======================================================
// FETCH GOVERNMENT MARKET DATA
// ======================================================

const fetchMarketData = async ({ state, district, commodity }) => {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    throw new Error("DATA_GOV_API_KEY is missing from server/.env");
  }

  const params = new URLSearchParams();
  params.set("api-key", apiKey);
  params.set("format", "json");
  params.set("limit", "100");

  if (state) {
    params.set("filters[State]", state);
  }
  if (district) {
    params.set("filters[District]", district);
  }
  if (commodity) {
    params.set("filters[Commodity]", commodity);
  }

  const url = `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE_ID}?${params.toString()}`;

  console.log(
    "Fetching government market data:",
    `State=${state || "All"},`,
    `District=${district || "All"},`,
    `Commodity=${commodity || "All"}`
  );

  const response = await fetchJson(url);
  const records = Array.isArray(response?.records) ? response.records : [];
  console.log("Government API records:", records.length);
  return records;
};

// ======================================================
// GROUP RAW API RECORDS INTO STRUCTURED MARKET ENTITIES
// ======================================================

const groupMarketRecords = (rawRecords, requestedCropName) => {
  if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
    return [];
  }

  const groups = {};

  for (const item of rawRecords) {
    const rawCommodity = String(item.Commodity || item.commodity || "").trim();
    const marketName = String(item.Market || item.market || "").trim();
    const modalPrice = parsePrice(item.Modal_Price ?? item.modal_price ?? item["Modal Price"]);
    const minPrice = parsePrice(item.Min_Price ?? item.min_price ?? item["Min Price"] ?? modalPrice);
    const maxPrice = parsePrice(item.Max_Price ?? item.max_price ?? item["Max Price"] ?? modalPrice);

    if (!rawCommodity || !marketName || modalPrice <= 0) {
      continue;
    }

    const cropName = normalizeCropName(rawCommodity, requestedCropName);
    const key = `${cropName}:::${marketName}`.toLowerCase();

    if (!groups[key]) {
      groups[key] = {
        cropName,
        marketName,
        state: String(item.State || item.state || "").trim(),
        district: String(item.District || item.district || "").trim(),
        variety: String(item.Variety || item.variety || "").trim(),
        category: getCategoryForCrop(cropName),
        unit: "₹/Kg",
        demandLevel: "Moderate",
        records: [],
      };
    }

    const date = parseArrivalDate(item.Arrival_Date || item.arrival_date || item["Arrival Date"]);
    groups[key].records.push({
      date,
      modalPrice: quintalToKg(modalPrice),
      minPrice: quintalToKg(minPrice || modalPrice),
      maxPrice: quintalToKg(maxPrice || modalPrice),
      variety: String(item.Variety || item.variety || "").trim(),
    });
  }

  const result = [];
  for (const key of Object.keys(groups)) {
    const group = groups[key];
    const byDate = {};

    for (const r of group.records) {
      if (!byDate[r.date]) {
        byDate[r.date] = { modalSum: 0, minSum: 0, maxSum: 0, count: 0, variety: r.variety };
      }
      byDate[r.date].modalSum += r.modalPrice;
      byDate[r.date].minSum += r.minPrice;
      byDate[r.date].maxSum += r.maxPrice;
      byDate[r.date].count += 1;
      if (r.variety && r.variety !== "Other" && r.variety !== "FAQ") {
        byDate[r.date].variety = r.variety;
      }
    }

    const sortedDates = Object.keys(byDate).sort();
    if (sortedDates.length === 0) continue;

    const history = sortedDates.map((date) => ({
      date,
      price: Number((byDate[date].modalSum / byDate[date].count).toFixed(2)),
    }));

    const latestDate = sortedDates[sortedDates.length - 1];
    const latestInfo = byDate[latestDate];
    const currentPrice = Number((latestInfo.modalSum / latestInfo.count).toFixed(2));
    const minPrice = Number((latestInfo.minSum / latestInfo.count).toFixed(2));
    const maxPrice = Number((latestInfo.maxSum / latestInfo.count).toFixed(2));
    const variety = latestInfo.variety || group.variety || "Other";

    let previousPrice = currentPrice;
    if (sortedDates.length >= 2) {
      const prevDate = sortedDates[sortedDates.length - 2];
      previousPrice = Number((byDate[prevDate].modalSum / byDate[prevDate].count).toFixed(2));
    }

    const priceChangePercent = calculatePriceChange(previousPrice, currentPrice);
    const trend = calculateTrend(previousPrice, currentPrice);

    let recommendation = "Compare prices across nearby markets before selling.";
    if (trend === "up" && priceChangePercent >= 3) {
      recommendation = "Demand is rising. Consider taking advantage of strong mandi prices.";
    } else if (trend === "down" && priceChangePercent <= -3) {
      recommendation = "Prices are dipping. Compare nearby mandis or store if holding capacity allows.";
    } else {
      recommendation = "Prices are steady. Monitor nearby markets for optimal harvest liquidation.";
    }

    result.push({
      cropName: group.cropName,
      category: group.category,
      marketName: group.marketName,
      state: group.state,
      district: group.district,
      variety,
      currentPrice,
      previousPrice,
      minPrice,
      maxPrice,
      unit: "₹/Kg",
      demandLevel: priceChangePercent > 5 ? "High" : priceChangePercent < -5 ? "Low" : "Moderate",
      recommendation,
      priceChangePercent,
      trend,
      history,
    });
  }

  return result;
};

// ======================================================
// REFRESH MARKET PRICES FOR FARMER
// ======================================================

const refreshMarketPricesForFarmer = async ({ state, district, cropNames = [] }) => {
  if (!state || !Array.isArray(cropNames) || cropNames.length === 0) {
    return [];
  }

  const allConverted = [];

  for (const cropName of cropNames) {
    // Resolve crop name variations in API
    const apiCommodities = CROP_TO_API_COMMODITIES[cropName] || [cropName];
    const cropRawRecords = [];

    for (const commodity of apiCommodities) {
      try {
        const records = await fetchMarketData({
          state,
          district,
          commodity,
        });
        cropRawRecords.push(...records);
      } catch (error) {
        console.error(`Market API query failed for ${commodity}:`, error.message);
      }
    }

    if (cropRawRecords.length > 0) {
      const grouped = groupMarketRecords(cropRawRecords, cropName);
      allConverted.push(...grouped);
    }
  }

  console.log(`Converted ${allConverted.length} structured government market entities with chronological history.`);
  return allConverted;
};

// ======================================================
// SAVE OR UPDATE MARKET DATA
// ======================================================

const saveMarketData = async (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    console.log("No market records available to save.");
    return;
  }

  let savedCount = 0;
  let failedCount = 0;

  for (const item of records) {
    try {
      if (!item.cropName || !item.marketName || parsePrice(item.currentPrice) <= 0) {
        continue;
      }

      const filter = {
        cropName: new RegExp(`^${item.cropName}$`, "i"),
        marketName: new RegExp(`^${item.marketName}$`, "i"),
      };

      const existing = await MarketPrice.findOne(filter).lean();

      if (!existing) {
        await MarketPrice.create({
          ...item,
          currentPrice: parsePrice(item.currentPrice),
          previousPrice: parsePrice(item.previousPrice || item.currentPrice),
          minPrice: parsePrice(item.minPrice || item.currentPrice),
          maxPrice: parsePrice(item.maxPrice || item.currentPrice),
          category: item.category || getCategoryForCrop(item.cropName),
          history: Array.isArray(item.history) && item.history.length > 0
            ? item.history
            : [{ date: getToday(), price: parsePrice(item.currentPrice) }],
        });
        savedCount++;
        continue;
      }

      // Merge and deduplicate history
      const existingHistory = Array.isArray(existing.history) ? existing.history : [];
      const newHistory = Array.isArray(item.history) ? item.history : [];
      const historyMap = {};

      for (const h of existingHistory) {
        if (h && h.date && typeof h.price === "number") {
          historyMap[h.date] = h.price;
        }
      }
      for (const h of newHistory) {
        if (h && h.date && typeof h.price === "number") {
          historyMap[h.date] = h.price;
        }
      }

      const mergedDates = Object.keys(historyMap).sort();
      const mergedHistory = mergedDates.map((date) => ({
        date,
        price: historyMap[date],
      }));

      const previousPrice =
        mergedHistory.length >= 2
          ? mergedHistory[mergedHistory.length - 2].price
          : parsePrice(item.previousPrice || existing.previousPrice || item.currentPrice);

      const currentPrice = parsePrice(item.currentPrice);
      const priceChangePercent = calculatePriceChange(previousPrice, currentPrice);
      const trend = calculateTrend(previousPrice, currentPrice);

      await MarketPrice.updateOne(
        { _id: existing._id },
        {
          $set: {
            cropName: item.cropName,
            category: item.category || existing.category || getCategoryForCrop(item.cropName),
            marketName: item.marketName,
            state: item.state || existing.state,
            district: item.district || existing.district,
            variety: item.variety || existing.variety || "Other",
            previousPrice,
            currentPrice,
            minPrice: parsePrice(item.minPrice),
            maxPrice: parsePrice(item.maxPrice),
            unit: item.unit || "₹/Kg",
            priceChangePercent,
            trend,
            history: mergedHistory,
            demandLevel: item.demandLevel || existing.demandLevel || "Moderate",
            recommendation: item.recommendation || existing.recommendation || "Compare prices across nearby markets before selling.",
          },
        }
      );

      savedCount++;
    } catch (error) {
      failedCount++;
      console.error(`Could not save ${item.cropName} at ${item.marketName}:`, error.message);
    }
  }

  console.log(`Market data update finished. Processed: ${savedCount}, Failed: ${failedCount}.`);
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  DEFAULT_COMMODITIES,
  CROP_TO_API_COMMODITIES,
  getCategoryForCrop,
  normalizeCropName,
  parseArrivalDate,
  groupMarketRecords,
  ensureMarketSeed,
  fetchMarketData,
  refreshMarketPricesForFarmer,
  saveMarketData,
};