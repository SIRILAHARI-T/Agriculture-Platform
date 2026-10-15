const express = require("express");
const router = express.Router();
const {
  getHealthLogs,
  addHealthLog,
  resolveHealthLog,
  deleteHealthLog,
  getDiagnosticsLibrary,
} = require("../controllers/healthController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/diagnostics-library", getDiagnosticsLibrary);

router.route("/")
  .get(getHealthLogs)
  .post(addHealthLog);

router.patch("/:id/resolve", resolveHealthLog);
router.delete("/:id", deleteHealthLog);

module.exports = router;

