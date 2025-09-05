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
const submitEvaluation = async (req, res, next) => {
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

    // Find the evaluation form
    EvaluationForm.findById(form_id, (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (!results.length)
        return res.status(404).json({ message: "Form not found" });

      const form = results[0];
      const sections = safeParseJSON(form.sections);

      // Calculate total points based on weights
      let totalPoints = 0;
      const calculatedScores = {};

      sections.forEach((section) => {
        section.criteria.forEach((criterion) => {
          const score = parseFloat(scores[criterion.id] || 0);
          const maxScore = parseFloat(criterion.maxScore || 5);
          const weight = parseFloat(criterion.weight || 0);
          const points = (score / maxScore) * weight;
          calculatedScores[criterion.id] = {
            score,
            maxScore,
            weight,
            points: parseFloat(points.toFixed(2)),
          };
          totalPoints += points;
        });
      });

      totalPoints = parseFloat(totalPoints.toFixed(2)); // total form score

      const evaluationData = {
        user_id,
        form_id,
        evaluator_id: req.userId,
        scores: JSON.stringify(calculatedScores),
        totalScore: totalPoints,
        comments: comments || "",
        submitted_at: new Date(),
        period_id: period_id || null, // optional period
      };

      Evaluation.create(evaluationData, (err, result) => {
        if (err) {
          console.error("DB insert error:", err);
          return res
            .status(500)
            .json({ message: "Error submitting evaluation" });
        }

        const usage = form.usageCount || 0;
        EvaluationForm.update(form_id, { usageCount: usage + 1 }, (err) => {
          if (err) console.error("Failed to update usageCount:", err);
        });

        res.status(201).json({
          message: "Evaluation submitted successfully",
          evaluationId: result.insertId,
          totalScore,
          calculatedScores,
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
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

      const evaluations = results.map((evaluation) => ({
        ...evaluation,
        scores: safeParseJSON(evaluation.scores, {}),
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
    if (evaluationData.scores) {
      evaluationData.scores = JSON.stringify(evaluationData.scores);
    }

    Evaluation.update(req.params.id, evaluationData, (err) => {
      if (err)
        return res.status(500).json({ message: "Error updating evaluation" });
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

      const evaluations = results.map((evaluation) => ({
        ...evaluation,
        scores: safeParseJSON(evaluation.scores, {}),
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

      // Format: [{ quarter: "Q1", score: 75 }, ...]
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
