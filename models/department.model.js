const db = require("../configs/db.config");

// Department Model
const Department = {
  // Create new department
  create: (data, callback) => {
    const { name, description } = data;
    db.query(
      "INSERT INTO departments (name, description) VALUES (?, ?)",
      [name, description || null],
      callback
    );
  },

  // Find all departments
  findAll: (callback) => {
    db.query("SELECT * FROM departments ORDER BY name ASC", callback);
  },

  // Find by ID
  findById: (id, callback) => {
    db.query("SELECT * FROM departments WHERE id = ?", [id], callback);
  },

  // Update department
  update: (id, data, callback) => {
    const { name, description } = data;
    db.query(
      "UPDATE departments SET name = ?, description = ? WHERE id = ?",
      [name, description || null, id],
      callback
    );
  },

  // Delete department
  delete: (id, callback) => {
    db.query("DELETE FROM departments WHERE id = ?", [id], callback);
  },
};

module.exports = Department;
