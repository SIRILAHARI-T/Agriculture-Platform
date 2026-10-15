const mongoose = require("mongoose");

const farmSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Farm name is required"],
      trim: true,
    },
    location: {
      address: { type: String, default: "" },
      district: { type: String, default: "" },
      state: { type: String, default: "" },
    },
    totalArea: {
      type: Number,
      required: [true, "Total farm area in acres is required"],
      min: [0.1, "Area must be greater than 0"],
    },
    soilType: {
      type: String,
      enum: ["Alluvial", "Black", "Red", "Clay", "Loamy", "Sandy", "Silt"],
      default: "Loamy",
    },
    soilPh: {
      type: Number,
      min: 3,
      max: 11,
      default: 6.8,
    },
    organicMatter: {
      type: Number,
      default: 2.5, // percentage
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, "Latitude coordinate is required"],
      },
      longitude: {
        type: Number,
        required: [true, "Longitude coordinate is required"],
      },
    },
    boundaryPoints: [
      {
        lat: { type: Number },
        lng: { type: Number },
      },
    ],
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Farm", farmSchema);

