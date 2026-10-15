const express = require("express");
const router = express.Router();
const {
  getMarketPrices,
  getMarketPriceById,
} = require("../controllers/marketController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect,getMarketPrices);
router.get("/:id", getMarketPriceById);

module.exports = router;

