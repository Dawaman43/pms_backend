const express = require("express");
const {
  submitEvaluation,
  getEvaluationsByUser,
  getEvaluationById,
  updateEvaluation,
  getAllEvaluations,
  getQuarterlyPerformance,
  getLoggedUserQuarterlyReport, // <- new function
} = require("../controllers/evaluation.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

const router = express.Router();

// Submit a new evaluation
router.post("/", verifyToken, submitEvaluation);

// Get all evaluations
router.get("/", verifyToken, getAllEvaluations);

// Get quarterly performance for a specific user
router.get("/quarterly/:userId", verifyToken, getQuarterlyPerformance);

// Get logged-in user's quarterly dashboard report
router.get("/dashboard/quarterly", verifyToken, getLoggedUserQuarterlyReport);

// Get evaluations by user
router.get("/user/:userId", verifyToken, getEvaluationsByUser);

// Get evaluation by ID
router.get("/:id", verifyToken, getEvaluationById);

// Update an evaluation
router.put("/:id", verifyToken, updateEvaluation);

module.exports = router;
