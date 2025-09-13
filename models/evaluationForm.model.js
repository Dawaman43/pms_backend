const db = require("../configs/db.config");

const EvaluationForm = {
  create: (formData, callback) => {
    if (!formData.period_id) {
      return callback(new Error("period_id is required"));
    }
    db.query("INSERT INTO evaluation_forms SET ?", formData, callback);
  },

  findAll: (callback) => {
    db.query("SELECT * FROM evaluation_forms", callback);
  },

  findById: (id, callback) => {
    db.query("SELECT * FROM evaluation_forms WHERE id = ?", [id], callback);
  },

  findByTeamId: (teamId, callback) => {
    const numericTeamId = parseInt(teamId, 10);
    if (isNaN(numericTeamId)) {
      return callback(new Error("Invalid team ID"));
    }
    const sql = "SELECT * FROM evaluation_forms WHERE team_id = ?";
    db.query(sql, [numericTeamId], callback);
  },

  findByTeamAndPeriod: (teamId, periodId, callback) => {
    const numericTeamId = parseInt(teamId, 10);
    const numericPeriodId = parseInt(periodId, 10);
    if (isNaN(numericTeamId) || isNaN(numericPeriodId)) {
      return callback(new Error("Invalid team or period ID"));
    }
    const sql = `
      SELECT * 
      FROM evaluation_forms
      WHERE team_id = ? AND period_id = ?
    `;
    db.query(sql, [numericTeamId, numericPeriodId], callback);
  },

  update: (id, formData, callback) => {
    if (formData.period_id && isNaN(parseInt(formData.period_id, 10))) {
      return callback(new Error("Invalid period ID"));
    }
    db.query(
      "UPDATE evaluation_forms SET ? WHERE id = ?",
      [formData, id],
      callback
    );
  },

  delete: (id, callback) => {
    db.query("DELETE FROM evaluation_forms WHERE id = ?", [id], callback);
  },

  findWithEvaluationsByTeamId: (teamId, callback) => {
    const numericTeamId = parseInt(teamId, 10);
    if (isNaN(numericTeamId)) return callback(new Error("Invalid team ID"));

    const sql = `
      SELECT f.*, 
             COALESCE(JSON_ARRAYAGG(e.scores), JSON_ARRAY()) AS evaluations
      FROM evaluation_forms f
      LEFT JOIN evaluations e ON e.form_id = f.id
      WHERE f.team_id = ?
      GROUP BY f.id
    `;
    db.query(sql, [numericTeamId], callback);
  },
};

module.exports = EvaluationForm;
