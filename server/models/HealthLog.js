const mongoose = require("mongoose");

const healthLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: [true, "Crop reference is required"],
      index: true,
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farm",
      required: [true, "Farm reference is required"],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Healthy", "Mild Stress", "Moderate Risk", "Critical"],
      default: "Healthy",
    },
    symptoms: [
      {
        type: String,
        trim: true,
      },
    ],
    diagnosis: {
      type: String,
      trim: true,
      default: "General Health Inspection",
    },
    severity: {
      type: String,
      enum: ["None", "Low", "Medium", "High"],
      default: "None",
    },
    suggestedActions: [
      {
        type: String,
        trim: true,
      },
    ],
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedDate: {
      type: Date,
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

module.exports = mongoose.model("HealthLog", healthLogSchema);

