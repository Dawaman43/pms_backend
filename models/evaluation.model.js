const db = require("../configs/db.config");

const Evaluation = {
  // Create a new evaluation
  create: (evaluationData, callback) => {
    db.query("INSERT INTO evaluations SET ?", evaluationData, callback);
  },

  // Find all evaluations for a user
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
  update: (id, evaluationData, callback) => {
    db.query(
      "UPDATE evaluations SET ? WHERE id = ?",
      [evaluationData, id],
      callback
    );
  },

  // Find evaluations by evaluator
  findByEvaluator: (evaluatorId, callback) => {
    db.query(
      "SELECT * FROM evaluations WHERE evaluator_id = ?",
      [evaluatorId],
      callback
    );
  },

  // Get quarterly average scores for a user
  findQuarterlyByUserId: (userId, callback) => {
    const sql = `
      SELECT quarter, 
             ROUND(AVG(JSON_EXTRACT(scores, '$[*].value')), 1) AS avgScore
      FROM evaluations
      WHERE user_id = ?
      GROUP BY quarter
      ORDER BY FIELD(quarter, 'Q1','Q2','Q3','Q4')
    `;
    db.query(sql, [userId], callback);
  },
};

module.exports = Evaluation;
