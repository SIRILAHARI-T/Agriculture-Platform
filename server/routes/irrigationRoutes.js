const express = require("express");
const router = express.Router();
const {
  getIrrigationOverview,
  getSchedules,
  createSchedule,
  updateScheduleStatus,
  deleteSchedule,
} = require("../controllers/irrigationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/overview", getIrrigationOverview);

router.route("/schedules")
  .get(getSchedules)
  .post(createSchedule);

router.patch("/schedules/:id/status", updateScheduleStatus);
router.delete("/schedules/:id", deleteSchedule);

module.exports = router;

