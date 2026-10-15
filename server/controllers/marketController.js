const MarketPrice = require("../models/MarketPrice");
const Farm = require("../models/Farm");
const Crop = require("../models/Crop");

const {
  refreshMarketPricesForFarmer,
  saveMarketData,
} = require("../services/marketService");

// Escape special characters before using user input in a regex.
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Get market prices relevant to logged-in farmer
// @route   GET /api/market
// @access  Private
const getMarketPrices = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view market prices.",
      });
    }

    // ==================================================
    // 1. GET THE FARMER'S FARMS
    // ==================================================

    const farms = await Farm.find({
      user: req.user._id,
    }).lean();

    if (!farms.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        location: {
          state: "",
          district: "",
        },
        crops: [],
        topGainers: [],
        topLosers: [],
        prices: [],
        message: "Please add a farm first.",
      });
    }

    // ==================================================
    // 2. GET THE FARMER'S CROPS
    // ==================================================

    const crops = await Crop.find({
      user: req.user._id,
    }).lean();

    const cropNames = [
      ...new Set(
        crops
          .map((crop) =>
            typeof crop.name === "string"
              ? crop.name.trim()
              : ""
          )
          .filter(Boolean)
      ),
    ];

    const farm = farms[0];

    const state =
      farm.location?.state?.trim() || "";

    const district =
      farm.location?.district?.trim() || "";

    console.log("========== MARKET REQUEST ==========");
    console.log("User ID:", String(req.user._id));
    console.log("Farm state:", state);
    console.log("Farm district:", district);
    console.log("Farmer crop names:", cropNames);

    if (!state) {
      return res.status(200).json({
        success: true,
        count: 0,
        location: {
          state: "",
          district,
        },
        crops: cropNames,
        topGainers: [],
        topLosers: [],
        prices: [],
        message: "Please add your farm state first.",
      });
    }

    if (!cropNames.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        location: {
          state,
          district,
        },
        crops: [],
        topGainers: [],
        topLosers: [],
        prices: [],
        message: "Please add a crop first.",
      });
    }

    // ==================================================
    // 3. BUILD THE DATABASE FILTER
    // ==================================================

    const { category, search } = req.query;

    const buildCropNameRegex = (name) => {
      const clean = String(name || "").trim();
      if (/paddy|rice/i.test(clean)) {
        return /^(paddy|rice|paddy \(rice\)|paddy\(dhan\).*)/i;
      }
      if (/maize|corn/i.test(clean)) {
        return /^(maize|corn)/i;
      }
      return new RegExp(`^${escapeRegex(clean)}$`, "i");
    };

    const filter = {
      $or: cropNames.map((name) => ({
        cropName: buildCropNameRegex(name),
      })),
    };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (typeof search === "string" && search.trim()) {
      const trimmed = search.trim();
      // Allow flexible whitespace matching (e.g. "Chenger i" matches "Chengeri")
      const flexible = escapeRegex(trimmed).replace(/\s+/g, "\\s*");
      const searchRegex = new RegExp(flexible, "i");

      const orConditions = [
        { cropName: searchRegex },
        { marketName: searchRegex },
        { state: searchRegex },
        { district: searchRegex },
        { variety: searchRegex },
      ];

      // Support searching "rice" or "paddy" interchangeably
      if (/paddy|rice/i.test(trimmed)) {
        orConditions.push({ cropName: /paddy|rice/i });
      }

      filter.$and = [{ $or: orConditions }];
    }

    console.log(
      "Market database filter:",
      JSON.stringify(filter)
    );

    // ==================================================
    // 4. QUERY SAVED MARKET PRICES FIRST
    // ==================================================

    let prices = await MarketPrice.find(filter)
      .sort({
        cropName: 1,
        marketName: 1,
      })
      .lean();

    console.log(
      "Records matching farmer filter:",
      prices.length
    );

    // If any farmer crop has zero records saved, fetch it from government API now
    const foundCrops = new Set(prices.map((p) => String(p.cropName || "").toLowerCase()));
    const missingCrops = cropNames.filter(
      (c) =>
        !foundCrops.has(c.toLowerCase()) &&
        !(/paddy|rice/i.test(c) && (foundCrops.has("paddy") || foundCrops.has("rice")))
    );

    if (missingCrops.length > 0) {
      console.log("Missing market data for crops:", missingCrops, "- refreshing from government API...");
      try {
        const freshData = await refreshMarketPricesForFarmer({
          state,
          district,
          cropNames: missingCrops,
        });
        if (freshData.length > 0) {
          await saveMarketData(freshData);
          prices = await MarketPrice.find(filter)
            .sort({
              cropName: 1,
              marketName: 1,
            })
            .lean();
        }
      } catch (err) {
        console.warn("Synchronous refresh for missing crops failed:", err.message);
      }
    }

    // ==================================================
    // 5. CALCULATE TOP GAINERS AND LOSERS
    // ==================================================

    const topGainers = [...prices]
      .filter(
        (item) =>
          Number(item.priceChangePercent || 0) > 0
      )
      .sort(
        (a, b) =>
          Number(b.priceChangePercent || 0) -
          Number(a.priceChangePercent || 0)
      )
      .slice(0, 3);

    const topLosers = [...prices]
      .filter(
        (item) =>
          Number(item.priceChangePercent || 0) < 0
      )
      .sort(
        (a, b) =>
          Number(a.priceChangePercent || 0) -
          Number(b.priceChangePercent || 0)
      )
      .slice(0, 3);

    // ==================================================
    // 6. RESPOND IMMEDIATELY WITH SAVED DATA
    // ==================================================

    res.status(200).json({
      success: true,
      count: prices.length,
      location: {
        state,
        district,
      },
      crops: cropNames,
      topGainers,
      topLosers,
      prices,
      message:
        prices.length > 0
          ? "Market prices loaded successfully."
          : "No saved market prices match the selected crops yet.",
    });

    // ==================================================
    // 7. REFRESH GOVERNMENT DATA IN THE BACKGROUND
    // ==================================================

    /*
     * Do not await this operation after sending the response.
     * A slow government API should not make the page wait.
     */
    refreshMarketPricesForFarmer({
      state,
      district,
      cropNames,
    })
      .then(async (marketData) => {
        if (!marketData.length) {
          console.log(
            "Background market refresh returned no valid records."
          );
          return;
        }

        await saveMarketData(marketData);

        console.log(
          `Background market refresh processed ${marketData.length} records.`
        );
      })
      .catch((error) => {
        console.error(
          "Background market refresh failed:",
          error.message
        );
      });
  } catch (error) {
    console.error(
      "Market controller error:",
      error.stack || error.message
    );

    // Avoid attempting to send a second response if the
    // response was already sent.
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to load market prices.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
};

// @desc    Get specific commodity price details
// @route   GET /api/market/:id
// @access  Public
const getMarketPriceById = async (req, res) => {
  try {
    const item = await MarketPrice.findById(
      req.params.id
    ).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Commodity price record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    console.error(
      "Get market price by ID error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load commodity price details.",
    });
  }
};

module.exports = {
  getMarketPrices,
  getMarketPriceById,
};
