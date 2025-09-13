const db = require("../configs/db.config");
const bcrypt = require("bcryptjs");

const User = {
  findByEmail: (email, callback) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], callback);
  },

  create: (userData, callback) => {
    db.query("INSERT INTO users SET ?", userData, callback);
  },

  findAll: (callback) => {
    const query = `
      SELECT u.*, t.name AS teamName, d.name AS departmentName
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN departments d ON u.department_id = d.id
    `;
    db.query(query, callback);
  },

  findById: (id, callback) => {
    const query = `
      SELECT u.*, t.name AS teamName, d.name AS departmentName
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
      LIMIT 1
    `;
    db.query(query, [id], callback);
  },

  findLeaders: (callback) => {
    db.query("SELECT * FROM users WHERE role = 'team_leader'", callback);
  },

  findLeadersByTeamId: (teamId, callback) => {
    db.query(
      "SELECT * FROM users WHERE role = 'team_leader' AND team_id = ?",
      [teamId],
      callback
    );
  },

  updateUser: (id, userData, callback) => {
    const { password, ...rest } = userData;
    db.query("UPDATE users SET ? WHERE id = ?", [rest, id], callback);
  },

  updatePassword: (id, oldPassword, newPassword, callback) => {
    db.query(
      "SELECT password FROM users WHERE id = ?",
      [id],
      (err, results) => {
        if (err) return callback(err);
        if (results.length === 0) return callback(new Error("User not found"));

        const storedHash = results[0].password;
        const isMatch = bcrypt.compareSync(oldPassword, storedHash);
        if (!isMatch) return callback(new Error("Old password is incorrect"));

        const hashedPassword = bcrypt.hashSync(newPassword, 8);

        db.query(
          "UPDATE users SET password = ? WHERE id = ?",
          [hashedPassword, id],
          callback
        );
      }
    );
  },

  delete: (id, callback) => {
    db.query("DELETE FROM users WHERE id = ?", [id], callback);
  },
};

module.exports = User;
