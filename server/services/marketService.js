const MarketPrice = require("../models/MarketPrice");

const DATA_GOV_RESOURCE_ID =
  "35985678-0d79-46b4-9ed6-6f13308a1d24";

const REQUEST_TIMEOUT = 80000;

// ======================================================
// DEFAULT MARKET DATA
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
    recommendation:
      "Good demand. Compare nearby markets before selling.",
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
    recommendation:
      "Demand is strong. Consider monitoring prices before selling.",
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
    recommendation:
      "Prices are fluctuating. Compare nearby markets before selling.",
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
    recommendation:
      "Stable demand. Monitor prices for better selling opportunities.",
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
    recommendation:
      "Demand is strong. Compare market prices before selling.",
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

const calculatePriceChange = (
  previousPrice,
  currentPrice
) => {
  if (previousPrice <= 0) {
    return 0;
  }

  return Number(
    (
      ((currentPrice - previousPrice) /
        previousPrice) *
      100
    ).toFixed(2)
  );
};

const calculateTrend = (
  previousPrice,
  currentPrice
) => {
  if (currentPrice > previousPrice) {
    return "up";
  }

  if (currentPrice < previousPrice) {
    return "down";
  }

  return "stable";
};

const getToday = () =>
  new Date().toISOString().split("T")[0];

// ======================================================
// ENSURE DEFAULT MARKET DATA EXISTS
// ======================================================

const ensureMarketSeed = async () => {
  try {
    const count = await MarketPrice.countDocuments();

    if (count > 0) {
      console.log(
        `Market data already exists (${count} records).`
      );

      return;
    }

    console.log(
      "No market data found. Creating default market data..."
    );

    const marketItems = DEFAULT_COMMODITIES.map(
      (item) => {
        const priceChangePercent =
          calculatePriceChange(
            item.previousPrice,
            item.currentPrice
          );

        const trend = calculateTrend(
          item.previousPrice,
          item.currentPrice
        );

        return {
          ...item,
          priceChangePercent,
          trend,
          history: [
            {
              date: getToday(),
              price: item.currentPrice,
            },
          ],
        };
      }
    );

    await MarketPrice.insertMany(marketItems);

    console.log(
      `Created ${marketItems.length} default market records.`
    );
  } catch (error) {
    console.error(
      "Failed to ensure market seed:",
      error.message
    );

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
      throw new Error(
        `data.gov.in returned HTTP ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        `Government market API timed out after ${REQUEST_TIMEOUT / 1000} seconds.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

// ======================================================
// QUINTAL TO KILOGRAM
// ======================================================

const quintalToKg = (value) => {
  const number = parsePrice(value);

  if (number <= 0) {
    return 0;
  }

  return Number((number / 100).toFixed(2));
};

// ======================================================
// FETCH GOVERNMENT MARKET DATA
// ======================================================

const fetchMarketData = async ({
  state,
  district,
  commodity,
}) => {
  const apiKey = process.env.DATA_GOV_API_KEY;

  if (!apiKey) {
    throw new Error(
      "DATA_GOV_API_KEY is missing from server/.env"
    );
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

  const url =
    `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE_ID}?${params.toString()}`;

  console.log(
    "Fetching government market data:",
    `State=${state || "All"},`,
    `District=${district || "All"},`,
    `Commodity=${commodity || "All"}`
  );

  const response = await fetchJson(url);

  const records = Array.isArray(response?.records)
    ? response.records
    : [];

  console.log(
    "Government API records:",
    records.length
  );

  return records;
};

// ======================================================
// CONVERT GOVERNMENT MARKET RECORD
// ======================================================

const convertMarketRecord = (item) => {
  const modalPrice = parsePrice(
    item.Modal_Price ??
      item.modal_price ??
      item["Modal Price"]
  );

  const minPrice = parsePrice(
    item.Min_Price ??
      item.min_price ??
      item["Min Price"] ??
      modalPrice
  );

  const maxPrice = parsePrice(
    item.Max_Price ??
      item.max_price ??
      item["Max Price"] ??
      modalPrice
  );

  const cropName = String(
    item.Commodity ||
      item.commodity ||
      ""
  ).trim();

  const marketName = String(
    item.Market ||
      item.market ||
      ""
  ).trim();

  const state = String(
    item.State ||
      item.state ||
      ""
  ).trim();

  const district = String(
    item.District ||
      item.district ||
      ""
  ).trim();

  const variety = String(
    item.Variety ||
      item.variety ||
      ""
  ).trim();

  if (!cropName || !marketName || modalPrice <= 0) {
    return null;
  }

  const currentPrice = quintalToKg(modalPrice);
  const convertedMinPrice =
    quintalToKg(minPrice || modalPrice);
  const convertedMaxPrice =
    quintalToKg(maxPrice || modalPrice);

  return {
    cropName,
    category: "Agricultural Crop",
    marketName,
    state,
    district,
    variety,
    currentPrice,
    previousPrice: currentPrice,
    minPrice: convertedMinPrice,
    maxPrice: convertedMaxPrice,
    unit: "₹/Kg",
    demandLevel: "Moderate",
    recommendation:
      "Compare prices across nearby markets before selling.",
    priceChangePercent: 0,
    trend: "stable",
    history: [
      {
        date: getToday(),
        price: currentPrice,
      },
    ],
  };
};

// ======================================================
// REFRESH MARKET PRICES FOR FARMER
// ======================================================

const refreshMarketPricesForFarmer = async ({
  state,
  district,
  cropNames = [],
}) => {
  if (!state || !Array.isArray(cropNames)) {
    return [];
  }

  if (cropNames.length === 0) {
    return [];
  }

  const allRecords = [];

  for (const cropName of cropNames) {
    try {
      const records = await fetchMarketData({
        state,
        district,
        commodity: cropName,
      });

      allRecords.push(...records);
    } catch (error) {
      console.error(
        `Market API failed for ${cropName}:`,
        error.message
      );
    }
  }

  const converted = allRecords
    .map(convertMarketRecord)
    .filter(Boolean);

  console.log(
    `Converted ${converted.length} valid government market records.`
  );

  return converted;
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
      if (
        !item.cropName ||
        !item.marketName ||
        parsePrice(item.currentPrice) <= 0
      ) {
        continue;
      }

      const filter = {
        cropName: item.cropName,
        marketName: item.marketName,
      };

      /*
       * Use a plain object instead of a mutable Mongoose
       * document. This avoids the existing.save() version
       * conflict shown in your backend logs.
       */
      const existing = await MarketPrice.findOne(
        filter
      ).lean();

      if (!existing) {
        /*
         * Upsert creates a record only if it does not
         * already exist. Existing records are not reset
         * to the initial API values.
         */
        await MarketPrice.updateOne(
          filter,
          {
            $setOnInsert: {
              ...item,
              currentPrice: parsePrice(
                item.currentPrice
              ),
            },
          },
          {
            upsert: true,
          }
        );

        savedCount++;
        continue;
      }

      const previousPrice = parsePrice(
        existing.currentPrice
      );

      const currentPrice = parsePrice(
        item.currentPrice
      );

      const priceChangePercent =
        calculatePriceChange(
          previousPrice,
          currentPrice
        );

      const trend = calculateTrend(
        previousPrice,
        currentPrice
      );

      const oldHistory = Array.isArray(
        existing.history
      )
        ? existing.history
        : [];

      const today = getToday();

      let history;

      if (
        oldHistory.length > 0 &&
        oldHistory[oldHistory.length - 1].date === today
      ) {
        history = [
          ...oldHistory.slice(0, -1),
          {
            date: today,
            price: currentPrice,
          },
        ];
      } else {
        history = [
          ...oldHistory,
          {
            date: today,
            price: currentPrice,
          },
        ];
      }

      history = history.slice(-14);

      /*
       * Update directly in MongoDB instead of calling
       * existing.save(), which was producing version errors.
       */
      await MarketPrice.updateOne(
        {
          _id: existing._id,
        },
        {
          $set: {
            previousPrice,
            currentPrice,
            minPrice: parsePrice(item.minPrice),
            maxPrice: parsePrice(item.maxPrice),
            unit: item.unit || "₹/Kg",
            priceChangePercent,
            trend,
            history,
            state: item.state,
            district: item.district,
            variety: item.variety,
            category:
              item.category ||
              existing.category ||
              "Agricultural Crop",
            demandLevel:
              item.demandLevel ||
              existing.demandLevel ||
              "Moderate",
            recommendation:
              item.recommendation ||
              existing.recommendation ||
              "Compare prices across nearby markets before selling.",
          },
        }
      );

      savedCount++;
    } catch (error) {
      failedCount++;

      console.error(
        `Could not save ${item.cropName} at ${item.marketName}:`,
        error.message
      );
    }
  }

  console.log(
    `Market data update finished. Processed: ${savedCount}, Failed: ${failedCount}.`
  );
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  DEFAULT_COMMODITIES,
  ensureMarketSeed,
  fetchMarketData,
  refreshMarketPricesForFarmer,
  saveMarketData,
};