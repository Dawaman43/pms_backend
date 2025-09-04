const db = require("../configs/db.config");

const EvaluationForm = {
  create: (formData, callback) => {
    db.query("INSERT INTO evaluation_forms SET ?", formData, callback);
  },

  findAll: (callback) => {
    db.query("SELECT * FROM evaluation_forms", callback);
  },

  findById: (id, callback) => {
    db.query("SELECT * FROM evaluation_forms WHERE id = ?", [id], callback);
  },

  findByTeamId: (teamId, callback) => {
    // Ensure teamId is numeric
    const numericTeamId = parseInt(teamId, 10);
    if (isNaN(numericTeamId)) {
      return callback(new Error("Invalid team ID"));
    }

    const sql = "SELECT * FROM evaluation_forms WHERE team_id = ?";
    db.query(sql, [numericTeamId], callback);
  },
  update: (id, formData, callback) => {
    db.query(
      "UPDATE evaluation_forms SET ? WHERE id = ?",
      [formData, id],
      callback
    );
  },

  delete: (id, callback) => {
    db.query("DELETE FROM evaluation_forms WHERE id = ?", [id], callback);
  },
};

module.exports = EvaluationForm;
