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
    db.query(
      "SELECT * FROM evaluation_forms WHERE team_id = ?",
      [teamId],
      callback
    );
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
