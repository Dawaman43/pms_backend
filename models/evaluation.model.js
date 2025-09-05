const db = require("../configs/db.config");

// Helper: Calculate points based on form and submitted scores
const calculateEvaluationPoints = (formSections, scores) => {
  let totalWeight = 0;
  let totalScore = 0;

  // Loop through each section and criterion
  formSections.forEach((section) => {
    section.criteria.forEach((criterion) => {
      const score = scores[criterion.id] || 0; // score submitted
      const weight = criterion.weight || 0;

      totalScore += (score * weight) / 100; // weighted score
      totalWeight += weight;
    });
  });

  return {
    calculated_points: scores, // raw per-criterion scores
    total_points: totalScore,
    average_points: totalWeight ? totalScore / totalWeight : 0,
  };
};

const Evaluation = {
  // Create a new evaluation
  create: async (evaluationData, callback) => {
    try {
      // Fetch the form to validate weights and sections
      db.query(
        "SELECT sections, weight FROM evaluation_forms WHERE id = ?",
        [evaluationData.form_id],
        (err, results) => {
          if (err) return callback(err);
          if (!results.length) return callback(new Error("Form not found"));

          const form = results[0];
          const sections = JSON.parse(form.sections);

          // Validate that total weight of criteria = 100
          let formTotalWeight = 0;
          sections.forEach((section) => {
            section.criteria.forEach((criterion) => {
              formTotalWeight += criterion.weight || 0;
            });
          });
          if (formTotalWeight !== 100) {
            return callback(
              new Error(
                `Total weight of all criteria in the form is ${formTotalWeight}%, must be 100%`
              )
            );
          }

          // Calculate points
          const scores = evaluationData.scores || {};
          const points = calculateEvaluationPoints(sections, scores);

          // Merge calculated points into evaluationData
          const finalEvaluation = {
            ...evaluationData,
            scores: JSON.stringify(points.calculated_points),
            total_points: points.total_points,
            average_points: points.average_points,
          };

          // Insert evaluation into DB
          db.query("INSERT INTO evaluations SET ?", finalEvaluation, callback);
        }
      );
    } catch (error) {
      callback(error);
    }
  },

  // Find evaluations by user
  findByUserId: (userId, callback) => {
    db.query("SELECT * FROM evaluations WHERE user_id = ?", [userId], callback);
  },

  // Find evaluation by ID
  findById: (id, callback) => {
    db.query("SELECT * FROM evaluations WHERE id = ?", [id], callback);
  },

  // Find all evaluations
  findAll: (callback) => {
    db.query("SELECT * FROM evaluations", callback);
  },

  // Update evaluation by ID
  update: async (id, evaluationData, callback) => {
    try {
      // Fetch form if scores are being updated
      if (evaluationData.scores) {
        db.query(
          "SELECT sections FROM evaluation_forms WHERE id = ?",
          [evaluationData.form_id],
          (err, results) => {
            if (err) return callback(err);
            if (!results.length) return callback(new Error("Form not found"));

            const sections = JSON.parse(results[0].sections);
            const scores = evaluationData.scores || {};

            // Recalculate points
            const points = calculateEvaluationPoints(sections, scores);
            const finalEvaluation = {
              ...evaluationData,
              scores: JSON.stringify(points.calculated_points),
              total_points: points.total_points,
              average_points: points.average_points,
            };

            db.query(
              "UPDATE evaluations SET ? WHERE id = ?",
              [finalEvaluation, id],
              callback
            );
          }
        );
      } else {
        db.query(
          "UPDATE evaluations SET ? WHERE id = ?",
          [evaluationData, id],
          callback
        );
      }
    } catch (error) {
      callback(error);
    }
  },
};

module.exports = Evaluation;
