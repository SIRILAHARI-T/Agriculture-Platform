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

    const filter = {
      cropName: {
        $in: cropNames.map(
          (name) =>
            new RegExp(`^${escapeRegex(name)}$`, "i")
        ),
      },
    };

    if (
      category &&
      category !== "All"
    ) {
      filter.category = category;
    }

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      // Use $and so the search condition doesn't overwrite
      // the crop filter or the selected category.
      filter.$and = [
        {
          $or: [
            { cropName: searchRegex },
            { marketName: searchRegex },
            { state: searchRegex },
            { district: searchRegex },
            { variety: searchRegex },
          ],
        },
      ];
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

    /*
     * If no exact crop-name matches were found, do a
     * diagnostic query for the farmer's crops without
     * category/search filters. This helps distinguish
     * missing crop records from overly restrictive filters.
     */
    if (prices.length === 0) {
      const basicFilter = {
        cropName: {
          $in: cropNames.map(
            (name) =>
              new RegExp(
                `^${escapeRegex(name)}$`,
                "i"
              )
          ),
        },
      };

      const basicMatches = await MarketPrice.find(
        basicFilter
      )
        .select("cropName marketName state district currentPrice")
        .limit(10)
        .lean();

      console.log(
        "Matches without category/search filters:",
        basicMatches.length
      );

      console.log(
        "Example matching records:",
        basicMatches
      );

      /*
       * This diagnostic query checks whether Potato
       * records exist independently of the farmer filter.
       */
      const potatoRecords = await MarketPrice.find({
        cropName: {
          $regex: "^Potato$",
          $options: "i",
        },
      })
        .select("cropName marketName state district currentPrice")
        .limit(5)
        .lean();

      console.log(
        "Potato records available in database:",
        potatoRecords.length
      );
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
