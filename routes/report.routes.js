const express = require("express");
const {
  generatePerformanceReport,
  generateEmployeeReport,
} = require("../controllers/report.controller");

const {
  verifyToken,
  isAdmin,
  isStaff,
  isTeamManager,
  isAdminOrTeamManager,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Performance report: admin or team manager
router.get(
  "/performance",
  verifyToken,
  isAdminOrTeamManager,
  generatePerformanceReport
);

// Employee report: staff or manager for their team members
router.get("/employee/:id", verifyToken, generateEmployeeReport);

module.exports = router;
