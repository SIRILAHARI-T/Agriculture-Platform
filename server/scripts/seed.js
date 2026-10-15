const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/../.env" });

const User = require("../models/User");
const Farm = require("../models/Farm");
const Crop = require("../models/Crop");
const HealthLog = require("../models/HealthLog");
const IrrigationSchedule = require("../models/IrrigationSchedule");
const MarketPrice = require("../models/MarketPrice");
const { DEFAULT_COMMODITIES } = require("../services/marketService");

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB Atlas.");

    // Clean existing seed data for demo user
    const demoEmail = "farmer@smartagri.com";
    let user = await User.findOne({ email: demoEmail });

    if (user) {
      console.log("Cleaning previous demo user data...");
      await Farm.deleteMany({ user: user._id });
      await Crop.deleteMany({ user: user._id });
      await HealthLog.deleteMany({ user: user._id });
      await IrrigationSchedule.deleteMany({ user: user._id });
      await User.deleteOne({ _id: user._id });
    }

    // Create demo farmer
    console.log("Creating demo farmer account...");
    user = await User.create({
      name: "Ramesh Patel",
      email: demoEmail,
      password: "Farmer@123", // Pre-save hook will hash this with bcrypt
      phone: "+91 98765 43210",
      location: "Punjab, India",
      experienceYears: 12,
      preferredLanguage: "English",
    });
    console.log(`Demo farmer created: ${user.email} (Password: Farmer@123)`);

    // Create Farms with GIS coordinates
    console.log("Seeding sample farms with GIS mapping data...");
    const farm1 = await Farm.create({
      user: user._id,
      name: "Green Valley Agro Farm",
      location: {
        address: "GT Road Sector 4",
        district: "Ludhiana",
        state: "Punjab",
      },
      totalArea: 14.5,
      soilType: "Alluvial",
      soilPh: 7.2,
      organicMatter: 3.1,
      coordinates: {
        latitude: 30.901,
        longitude: 75.8573,
      },
      boundaryPoints: [
        { lat: 30.903, lng: 75.855 },
        { lat: 30.903, lng: 75.86 },
        { lat: 30.899, lng: 75.86 },
        { lat: 30.899, lng: 75.855 },
      ],
      notes: "Primary irrigated parcel with solar-powered drip system.",
    });

    const farm2 = await Farm.create({
      user: user._id,
      name: "Sunrise Organic Orchards",
      location: {
        address: "Dindori Road",
        district: "Nashik",
        state: "Maharashtra",
      },
      totalArea: 8.0,
      soilType: "Black",
      soilPh: 6.8,
      organicMatter: 2.8,
      coordinates: {
        latitude: 19.9975,
        longitude: 73.7898,
      },
      boundaryPoints: [
        { lat: 20.0, lng: 73.787 },
        { lat: 20.0, lng: 73.792 },
        { lat: 19.995, lng: 73.792 },
        { lat: 19.995, lng: 73.787 },
      ],
      notes: "Vegetables and horticultural crops under high-efficiency micro-sprinklers.",
    });

    const farm3 = await Farm.create({
      user: user._id,
      name: "Evergreen Southern Acres",
      location: {
        address: "NH 44 Farm Belt",
        district: "Kurnool",
        state: "Andhra Pradesh",
      },
      totalArea: 12.0,
      soilType: "Red",
      soilPh: 6.4,
      organicMatter: 2.1,
      coordinates: {
        latitude: 15.8281,
        longitude: 78.0373,
      },
      boundaryPoints: [
        { lat: 15.83, lng: 78.035 },
        { lat: 15.83, lng: 78.04 },
        { lat: 15.826, lng: 78.04 },
        { lat: 15.826, lng: 78.035 },
      ],
      notes: "Cotton and maize cultivation with furrow irrigation.",
    });

    // Create Crops
    console.log("Seeding crops across diverse growth stages...");
    const crop1 = await Crop.create({
      user: user._id,
      farm: farm1._id,
      name: "Wheat (Sharbati)",
      variety: "HD-2967 High Yield",
      category: "Cereal",
      plantingDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      expectedHarvestDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      allocatedArea: 8.5,
      growthStage: "Vegetative",
      currentHealthStatus: "Healthy",
      yieldEstimate: { expected: 180, unit: "kg" },
      notes: "Resistant to stripe rust; excellent canopy closure.",
    });

    const crop2 = await Crop.create({
      user: user._id,
      farm: farm1._id,
      name: "Basmati Rice (1121)",
      variety: "Pusa Basmati 1121",
      category: "Cereal",
      plantingDate: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
      expectedHarvestDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      allocatedArea: 6.0,
      growthStage: "Flowering",
      currentHealthStatus: "Healthy",
      yieldEstimate: { expected: 110, unit: "kg" },
      notes: "Entering panicle emergence; requires vigilant moisture balance.",
    });

    const crop3 = await Crop.create({
      user: user._id,
      farm: farm2._id,
      name: "Tomato (Hybrid Roma)",
      variety: "Abhinav F1",
      category: "Vegetable",
      plantingDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      expectedHarvestDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      allocatedArea: 4.5,
      growthStage: "Fruiting / Grain Filling",
      currentHealthStatus: "Moderate Risk",
      yieldEstimate: { expected: 140, unit: "kg" },
      notes: "Early blight spots detected on lower branches.",
    });

    const crop4 = await Crop.create({
      user: user._id,
      farm: farm2._id,
      name: "Potato (Jyoti)",
      variety: "Kufri Jyoti",
      category: "Vegetable",
      plantingDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expectedHarvestDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
      allocatedArea: 3.5,
      growthStage: "Germination",
      currentHealthStatus: "Healthy",
      yieldEstimate: { expected: 90, unit: "kg" },
      notes: "Uniform emergence observed across 92% of the ridges.",
    });

    const crop5 = await Crop.create({
      user: user._id,
      farm: farm3._id,
      name: "Cotton (Bt Hybrid)",
      variety: "RCH 659 BG-II",
      category: "Cash Crop",
      plantingDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      expectedHarvestDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
      allocatedArea: 7.0,
      growthStage: "Vegetative",
      currentHealthStatus: "Mild Stress",
      yieldEstimate: { expected: 75, unit: "kg" },
      notes: "Minor jassid and whitefly activity observed on border rows.",
    });

    // Seed Health Observations
    console.log("Seeding diagnostic crop health logs...");
    await HealthLog.create({
      user: user._id,
      farm: farm2._id,
      crop: crop3._id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "Moderate Risk",
      symptoms: [
        "Dark brown concentric spots on leaves",
        "Water-soaked lesions on lower foliage",
      ],
      diagnosis: "Early / Late Blight",
      severity: "High",
      suggestedActions: [
        "Spray Mancozeb (2.5g/L) or Copper Oxychloride at first sign.",
        "Organic: Apply Trichoderma viride culture and prune infected lower foliage.",
        "Avoid overhead sprinkler irrigation to reduce leaf wetness duration.",
      ],
      resolved: false,
      notes: "Scouted 12 infected plants in eastern quadrant.",
    });

    await HealthLog.create({
      user: user._id,
      farm: farm3._id,
      crop: crop5._id,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: "Mild Stress",
      symptoms: ["Curled sticky leaves", "Yellowing foliage"],
      diagnosis: "Aphid / Whitefly Infestation",
      severity: "Medium",
      suggestedActions: [
        "Spray Neem Seed Kernel Extract (5%) or Neem Oil (3ml/L with mild soap).",
        "Install yellow sticky traps across field at canopy height.",
      ],
      resolved: false,
      notes: "Sticky honeydew visible on upper leaves.",
    });

    // Seed Irrigation Schedules
    console.log("Seeding smart irrigation schedules...");
    await IrrigationSchedule.create({
      user: user._id,
      farm: farm1._id,
      crop: crop2._id,
      waterRequirementMm: 24,
      waterRequirementLiters: 580000,
      irrigationMethod: "Drip",
      scheduledDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // Today evening
      status: "Pending",
      weatherAdjustmentReason: "Flowering stage critical moisture requirement; sunny conditions.",
      notes: "Run drip line block A and B for 2.5 hours.",
    });

    await IrrigationSchedule.create({
      user: user._id,
      farm: farm2._id,
      crop: crop3._id,
      waterRequirementMm: 18,
      waterRequirementLiters: 325000,
      irrigationMethod: "Sprinkler",
      scheduledDate: new Date(Date.now() + 36 * 60 * 60 * 1000), // Tomorrow
      status: "Pending",
      weatherAdjustmentReason: "Maintain soil moisture for tomato fruit enlargement.",
      notes: "Check nozzle pressure before starting pumps.",
    });

    // Seed Market Commodities
    console.log("Seeding agricultural commodity pricing data...");
    await MarketPrice.deleteMany({});
    const marketItems = DEFAULT_COMMODITIES.map((item) => {
      const diff = item.currentPrice - item.previousPrice;
      const pct = parseFloat(((diff / item.previousPrice) * 100).toFixed(2));
      const trend = diff > 0 ? "up" : diff < 0 ? "down" : "stable";
      return {
        ...item,
        priceChangePercent: pct,
        trend,
      };
    });
    await MarketPrice.insertMany(marketItems);

    console.log("Database seeding completed successfully!");
    console.log("Summary:");
    console.log(`- 1 Demo Farmer (farmer@smartagri.com / Farmer@123)`);
    console.log(`- 3 Farms with GIS Coordinates`);
    console.log(`- 5 Active Crops with Stage Tracking`);
    console.log(`- 2 Active Health Diagnostic Logs`);
    console.log(`- 2 Smart Irrigation Schedules`);
    console.log(`- ${marketItems.length} Market Commodity Trends`);

    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();

