const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farm",
      required: [true, "Farm association is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
    },
    variety: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: ["Cereal", "Pulse", "Vegetable", "Fruit", "Cash Crop", "Oilseed", "Other"],
      default: "Cereal",
    },
    plantingDate: {
      type: Date,
      required: [true, "Planting/Sowing date is required"],
    },
    expectedHarvestDate: {
      type: Date,
      required: [true, "Expected harvest date is required"],
    },
    allocatedArea: {
      type: Number,
      required: [true, "Allocated area in acres is required"],
      min: [0.1, "Area must be at least 0.1 acre"],
    },
    growthStage: {
      type: String,
      enum: [
        "Germination",
        "Vegetative",
        "Flowering",
        "Fruiting / Grain Filling",
        "Ripening / Maturation",
        "Harvested",
      ],
      default: "Vegetative",
    },
    currentHealthStatus: {
      type: String,
      enum: ["Healthy", "Mild Stress", "Moderate Risk", "Critical"],
      default: "Healthy",
    },
    yieldEstimate: {
      expected: { type: Number, default: 0 },
      unit: { type: String, default: "Kg" },
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Crop", cropSchema);

