const express = require("express");
const {
  submitEvaluation,
  getEvaluationsByUser,
  getEvaluationById,
  updateEvaluation,
  getAllEvaluations,
} = require("../controllers/evaluation.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", verifyToken, submitEvaluation);
router.get("/", verifyToken, getAllEvaluations);
router.get("/user/:userId", verifyToken, getEvaluationsByUser);
router.get("/:id", verifyToken, getEvaluationById);
router.put("/:id", verifyToken, updateEvaluation);

module.exports = router;
