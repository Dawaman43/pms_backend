const db = require("../configs/db.config");

// Helper: Safely parse JSON
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

// Helper: Calculate total & weighted points based on criteria
const calculatePoints = (criteriaList, scores) => {
  let totalPoints = 0;
  const calculatedScores = {};

  criteriaList.forEach((criterion) => {
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

  return {
    calculatedScores,
    totalPoints: parseFloat(totalPoints.toFixed(2)),
  };
};

const Evaluation = {
  // Create a new evaluation
  create: (evaluationData, callback) => {
    const { form_id, scores } = evaluationData;
    if (!form_id || !scores)
      return callback(new Error("Form ID and scores required"));

    // Fetch the form's criteria
    db.query(
      "SELECT criteria, usageCount FROM evaluation_forms WHERE id = ?",
      [form_id],
      (err, results) => {
        if (err) return callback(err);
        if (!results.length) return callback(new Error("Form not found"));

        const form = results[0];
        const criteriaList = safeParseJSON(form.criteria, []);

        // Calculate points automatically
        const { calculatedScores, totalPoints } = calculatePoints(
          criteriaList,
          scores
        );

        // Prepare data to insert
        const finalEvaluation = {
          ...evaluationData,
          scores: JSON.stringify(calculatedScores),
          totalScore: totalPoints,
          submitted_at: new Date(),
        };

        // Insert evaluation
        db.query(
          "INSERT INTO evaluations SET ?",
          finalEvaluation,
          (err, result) => {
            if (err) return callback(err);

            // Increment usage count on form
            const newUsage = (form.usageCount || 0) + 1;
            db.query(
              "UPDATE evaluation_forms SET usageCount = ? WHERE id = ?",
              [newUsage, form_id],
              (err) => {
                if (err) console.error("Failed to update usageCount:", err);
              }
            );

            callback(null, result);
          }
        );
      }
    );
  },

  // Update an existing evaluation
  update: (id, evaluationData, callback) => {
    const { form_id, scores } = evaluationData;

    if (scores && form_id) {
      // Recalculate points if scores are provided
      db.query(
        "SELECT criteria FROM evaluation_forms WHERE id = ?",
        [form_id],
        (err, results) => {
          if (err) return callback(err);
          if (!results.length) return callback(new Error("Form not found"));

          const criteriaList = safeParseJSON(results[0].criteria, []);
          const { calculatedScores, totalPoints } = calculatePoints(
            criteriaList,
            scores
          );

          const finalEvaluation = {
            ...evaluationData,
            scores: JSON.stringify(calculatedScores),
            totalScore: totalPoints,
          };

          db.query(
            "UPDATE evaluations SET ? WHERE id = ?",
            [finalEvaluation, id],
            callback
          );
        }
      );
    } else {
      // Update other fields without recalculating
      db.query(
        "UPDATE evaluations SET ? WHERE id = ?",
        [evaluationData, id],
        callback
      );
    }
  },

  findById: (id, callback) => {
    db.query("SELECT * FROM evaluations WHERE id = ?", [id], callback);
  },

  findByUserId: (userId, callback) => {
    db.query("SELECT * FROM evaluations WHERE user_id = ?", [userId], callback);
  },

  findAll: (callback) => {
    db.query("SELECT * FROM evaluations", callback);
  },

  getQuarterlyPerformance: (userId, callback) => {
    const sql = `
      SELECT QUARTER(submitted_at) AS quarter, AVG(totalScore) AS avgScore
      FROM evaluations
      WHERE user_id = ?
      GROUP BY quarter
      ORDER BY quarter
    `;
    db.query(sql, [userId], callback);
  },
};

module.exports = Evaluation;
