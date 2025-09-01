const Evaluation = require("../models/evaluation.model");
const EvaluationForm = require("../models/evaluationForm.model");

const submitEvaluation = async (req, res, next) => {
  try {
    if (!["staff", "team_leader"].includes(req.userRole)) {
      return res
        .status(403)
        .json({ message: "Not authorized to submit evaluations" });
    }

    const { user_id, form_id, scores, comments } = req.body;

    if (!user_id || !form_id || !scores || Object.keys(scores).length === 0) {
      return res.status(400).json({
        message: "User ID, form ID, and scores are required",
      });
    }

    let scoresJSON;
    try {
      scoresJSON = JSON.stringify(scores);
    } catch (err) {
      return res.status(400).json({ message: "Scores must be valid JSON" });
    }

    EvaluationForm.findById(form_id, (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (!results.length)
        return res.status(404).json({ message: "Form not found" });

      const evaluationData = {
        user_id,
        form_id,
        evaluator_id: req.userId,
        scores: scoresJSON,
        comments: comments || "",
        submitted_at: new Date(),
      };

      Evaluation.create(evaluationData, (err, result) => {
        if (err) {
          console.error("DB insert error:", err);
          return res
            .status(500)
            .json({ message: "Error submitting evaluation" });
        }

        const usage = results[0].usageCount || 0;
        EvaluationForm.update(form_id, { usageCount: usage + 1 }, (err) => {
          if (err) console.error("Failed to update usageCount:", err);
        });

        res.status(201).json({
          message: "Evaluation submitted successfully",
          evaluationId: result.insertId,
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    next(error);
  }
};

const getEvaluationsByUser = (req, res, next) => {
  try {
    if (!["team_manager", "admin"].includes(req.userRole)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view evaluations" });
    }

    Evaluation.findByUserId(req.params.userId, (err, results) => {
      if (err) {
        return next(new Error("Error fetching evaluations"));
      }

      const evaluations = results.map((evaluation) => ({
        ...evaluation,
        scores: evaluation.scores ? JSON.parse(evaluation.scores) : {},
      }));

      res.json(evaluations);
    });
  } catch (error) {
    next(error);
  }
};

const getEvaluationById = (req, res, next) => {
  try {
    if (!["team_manager", "admin"].includes(req.userRole)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view evaluation" });
    }

    Evaluation.findById(req.params.id, (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      const evaluation = {
        ...results[0],
        scores: results[0].scores ? JSON.parse(results[0].scores) : {},
      };

      res.json(evaluation);
    });
  } catch (error) {
    next(error);
  }
};

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
      if (err) {
        return res.status(500).json({ message: "Error updating evaluation" });
      }
      res.json({ message: "Evaluation updated successfully" });
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
};
