const Evaluation = require("../models/evaluation.model");
const EvaluationForm = require("../models/evaluationForm.model");

// ---------------------- UTILITIES ----------------------
const safeParseJSON = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  if (Buffer.isBuffer(value)) value = value.toString("utf8");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return Array.isArray(value) ? value : defaultValue;
};

// ---------------------- SUBMIT EVALUATION ----------------------
const submitEvaluation = (req, res, next) => {
  try {
    if (!["staff", "team_leader"].includes(req.userRole)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let { user_id, form_id, scores, comments, period_id } = req.body;
    console.log("Evaluation submission payload:", req.body);

    if (!user_id || !form_id || !scores) {
      return res
        .status(400)
        .json({ message: "User ID, form ID, and scores are required" });
    }

    // Parse scores if they come as a string
    if (typeof scores === "string") {
      try {
        scores = JSON.parse(scores);
      } catch (err) {
        return res.status(400).json({ message: "Invalid scores format" });
      }
    }

    // Convert scores to numbers
    const numericScores = {};
    Object.keys(scores).forEach((key) => {
      numericScores[key] = Number(scores[key]) || 0;
    });

    // ----------------- CALCULATE TOTAL & AVERAGE -----------------
    const scoreValues = Object.values(numericScores);
    const total_points = scoreValues.reduce((sum, val) => sum + val, 0);
    const average_points =
      scoreValues.length > 0 ? total_points / scoreValues.length : 0;

    // Create evaluation data (without totalScore)
    const evaluationData = {
      user_id,
      form_id,
      evaluator_id: req.userId,
      scores: JSON.stringify(numericScores),
      total_points,
      average_points,
      comments,
      period_id,
      submitted_at: new Date(),
    };

    Evaluation.create(evaluationData, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      res.status(201).json({
        message: "Evaluation submitted successfully",
        evaluationId: result.insertId,
      });
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------- GET EVALUATIONS BY USER ----------------------
const getEvaluationsByUser = (req, res, next) => {
  try {
    const requestedUserId = parseInt(req.params.userId);
    if (
      !["staff", "team_leader", "team_manager", "admin"].includes(req.userRole)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view evaluations" });
    }

    Evaluation.findByUserId(requestedUserId, (err, results) => {
      if (err) return next(new Error("Error fetching evaluations"));

      const evaluations = results.map((e) => ({
        ...e,
        scores: safeParseJSON(e.scores, {}),
      }));

      res.json(evaluations);
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------- GET EVALUATION BY ID ----------------------
const getEvaluationById = (req, res, next) => {
  try {
    if (
      !["staff", "team_leader", "team_manager", "admin"].includes(req.userRole)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view evaluation" });
    }

    Evaluation.findById(req.params.id, (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ message: "Evaluation not found" });

      const evaluation = {
        ...results[0],
        scores: safeParseJSON(results[0].scores, {}),
      };

      res.json(evaluation);
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------- UPDATE EVALUATION ----------------------
const updateEvaluation = (req, res, next) => {
  try {
    if (!["team_manager", "admin"].includes(req.userRole)) {
      return res
        .status(403)
        .json({ message: "Not authorized to update evaluations" });
    }

    const evaluationData = { ...req.body };

    Evaluation.update(req.params.id, evaluationData, (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: err.message || "Error updating evaluation" });

      res.json({ message: "Evaluation updated successfully" });
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------- GET ALL EVALUATIONS ----------------------
const getAllEvaluations = (req, res, next) => {
  try {
    if (
      !["staff", "team_leader", "team_manager", "admin"].includes(req.userRole)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view evaluations" });
    }

    Evaluation.findAll((err, results) => {
      if (err) return next(new Error("Error fetching evaluations"));

      const evaluations = results.map((e) => ({
        ...e,
        scores: safeParseJSON(e.scores, {}),
      }));

      res.json(evaluations);
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------- GET QUARTERLY PERFORMANCE ----------------------
const getQuarterlyPerformance = (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId) return res.status(400).json({ message: "User ID required" });

    if (
      !["staff", "team_leader", "team_manager", "admin"].includes(req.userRole)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view quarterly performance" });
    }

    Evaluation.getQuarterlyPerformance(userId, (err, results) => {
      if (err) return next(err);

      const formatted = results.map((r) => ({
        quarter: r.quarter,
        score: parseFloat(r.avgScore) || 0,
      }));

      res.json(formatted);
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitEvaluation,
  getEvaluationsByUser,
  getEvaluationById,
  updateEvaluation,
  getAllEvaluations,
  getQuarterlyPerformance,
};
