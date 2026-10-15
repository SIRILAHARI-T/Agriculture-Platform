const mongoose = require("mongoose");

const irrigationScheduleSchema = new mongoose.Schema(
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
      required: [true, "Farm reference is required"],
      index: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: [true, "Crop reference is required"],
      index: true,
    },
    waterRequirementMm: {
      type: Number,
      required: true,
      default: 20, // in mm
    },
    waterRequirementLiters: {
      type: Number,
      default: 0,
    },
    irrigationMethod: {
      type: String,
      enum: ["Drip", "Sprinkler", "Furrow", "Flood", "Center Pivot"],
      default: "Drip",
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Postponed due to Rain", "Skipped"],
      default: "Pending",
    },
    weatherAdjustmentReason: {
      type: String,
      default: "Optimal schedule based on forecast",
    },
    completedAt: {
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

module.exports = mongoose.model("IrrigationSchedule", irrigationScheduleSchema);

