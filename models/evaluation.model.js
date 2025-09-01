const db = require("../configs/db.config");

const Evaluation = {
  create: (evaluationData, callback) => {
    db.query("INSERT INTO evaluations SET ?", evaluationData, callback);
  },

  findByUserId: (userId, callback) => {
    db.query("SELECT * FROM evaluations WHERE user_id = ?", [userId], callback);
  },

  findById: (id, callback) => {
    db.query("SELECT * FROM evaluations WHERE id = ?", [id], callback);
  },

  update: (id, evaluationData, callback) => {
    db.query(
      "UPDATE evaluations SET ? WHERE id = ?",
      [evaluationData, id],
      callback
    );
  },

  findByEvaluator: (evaluatorId, callback) => {
    db.query(
      "SELECT * FROM evaluations WHERE evaluator_id = ?",
      [evaluatorId],
      callback
    );
  },
};

module.exports = Evaluation;
