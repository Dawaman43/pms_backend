const db = require("../configs/db.config");

const Department = {
  create: (data, callback) => {
    const { name, description } = data;
    db.query(
      "INSERT INTO departments (name, description) VALUES (?, ?)",
      [name, description || null],
      callback
    );
  },

  findAll: (callback) => {
    db.query("SELECT * FROM departments ORDER BY name ASC", callback);
  },

  findById: (id, callback) => {
    db.query("SELECT * FROM departments WHERE id = ?", [id], callback);
  },

  update: (id, data, callback) => {
    const { name, description } = data;
    db.query(
      "UPDATE departments SET name = ?, description = ? WHERE id = ?",
      [name, description || null, id],
      callback
    );
  },

  delete: (id, callback) => {
    db.query("DELETE FROM departments WHERE id = ?", [id], callback);
  },
};

module.exports = Department;
