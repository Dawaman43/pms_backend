const db = require("../configs/db.config");

const EvaluationForm = {
  // Create a new evaluation form
  create: (formData, callback) => {
    db.query("INSERT INTO evaluation_forms SET ?", formData, callback);
  },

  // Fetch all evaluation forms
  findAll: (callback) => {
    db.query("SELECT * FROM evaluation_forms", callback);
  },

  // Fetch a form by its ID
  findById: (id, callback) => {
    db.query("SELECT * FROM evaluation_forms WHERE id = ?", [id], callback);
  },

  // Fetch forms by team ID (numeric check)
  findByTeamId: (teamId, callback) => {
    const numericTeamId = parseInt(teamId, 10);
    if (isNaN(numericTeamId)) {
      return callback(new Error("Invalid team ID"));
    }
    const sql = "SELECT * FROM evaluation_forms WHERE team_id = ?";
    db.query(sql, [numericTeamId], callback);
  },

  // Update form by ID
  update: (id, formData, callback) => {
    db.query(
      "UPDATE evaluation_forms SET ? WHERE id = ?",
      [formData, id],
      callback
    );
  },

  // Delete form by ID
  delete: (id, callback) => {
    db.query("DELETE FROM evaluation_forms WHERE id = ?", [id], callback);
  },

  // Optional: Fetch forms along with their evaluations
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
