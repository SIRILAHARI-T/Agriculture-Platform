const express = require("express");
const router = express.Router();
const {
  getFarms,
  getFarmById,
  createFarm,
  updateFarm,
  deleteFarm,
} = require("../controllers/farmController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(getFarms)
  .post(createFarm);

router.route("/:id")
  .get(getFarmById)
  .put(updateFarm)
  .delete(deleteFarm);

module.exports = router;

