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

// ---------------------- Submit Evaluation ----------------------
const submitEvaluation = (req, res, next) => {
  try {
    if (!["staff", "team_leader"].includes(req.userRole)) {
      return res
        .status(403)
        .json({ message: "Not authorized to submit evaluations" });
    }

    const { user_id, form_id, scores, comments, period_id } = req.body;
    if (!user_id || !form_id || !scores || Object.keys(scores).length === 0) {
      return res
        .status(400)
        .json({ message: "User ID, form ID, and scores are required" });
    }

    // Pass data directly to the model
    Evaluation.create(
      {
        user_id,
        form_id,
        scores,
        comments,
        evaluator_id: req.userId,
        period_id,
      },
      (err, result) => {
        if (err)
          return res
            .status(500)
            .json({ message: err.message || "Error submitting evaluation" });

        res.status(201).json({
          message: "Evaluation submitted successfully",
          evaluationId: result.insertId,
        });
      }
    );
  } catch (error) {
    next(error);
  }
};

// ---------------------- Get Evaluations By User ----------------------
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

// ---------------------- Get Evaluation By ID ----------------------
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

// ---------------------- Update Evaluation ----------------------
const updateEvaluation = (req, res, next) => {
  try {
    if (!["team_manager", "admin"].includes(req.userRole)) {
      return res
        .status(403)
        .json({ message: "Not authorized to update evaluations" });
    }

    const evaluationData = { ...req.body };

    // Pass directly to model; model recalculates points if scores exist
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

// ---------------------- Get All Evaluations ----------------------
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

// ---------------------- Get Quarterly Performance ----------------------
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
