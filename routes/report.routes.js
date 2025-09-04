const express = require("express");
const {
  generatePerformanceReport,
  generateEmployeeReport,
} = require("../controllers/report.controller");

const {
  verifyToken,
  isAdmin,
  isTeamLeader,
  isAdminOrTeamLeader,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Performance report: admin or team leader
router.get(
  "/performance",
  verifyToken,
  isAdminOrTeamLeader,
  generatePerformanceReport
);

// Employee report: staff or leader (for their team members)
router.get("/employee/:id", verifyToken, generateEmployeeReport);

module.exports = router;
