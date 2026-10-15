const mongoose = require("mongoose");

const marketPriceSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: "Cereal",
    },
    marketName: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      index: true,
    },

    district: {
      type: String,
      trim: true,
      index: true,
    },

    variety: {
      type: String,
      trim: true,
      default: "",
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    previousPrice: {
      type: Number,
      required: true,
    },
    priceChangePercent: {
      type: Number,
      default: 0,
    },
    trend: {
      type: String,
      enum: ["up", "down", "stable"],
      default: "stable",
    },
    unit: {
      type: String,
      default: "₹/Kg",
    },
    minPrice: {
      type: Number,
    },
    maxPrice: {
      type: Number,
    },
    demandLevel: {
      type: String,
      enum: ["High", "Moderate", "Low"],
      default: "Moderate",
    },
    history: [
      {
        date: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    recommendation: {
      type: String,
      default: "Maintain regular market watch",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MarketPrice", marketPriceSchema);

