const express = require("express");
const router = express.Router();
const {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
} = require("../controllers/cropController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(getCrops)
  .post(createCrop);

router.route("/:id")
  .get(getCropById)
  .put(updateCrop)
  .delete(deleteCrop);

module.exports = router;

