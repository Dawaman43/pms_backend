const db = require("../configs/db.config");

const Team = {
  create: (teamData, callback) => {
    db.query("INSERT INTO teams SET ?", teamData, callback);
  },

  findAll: (callback) => {
    const query = `
      SELECT t.id, t.name, t.description, t.created_at,
             u.name AS leaderName,
             d.name AS departmentName
      FROM teams t
      LEFT JOIN users u ON t.leader_id = u.id
      LEFT JOIN departments d ON t.department_id = d.id
      ORDER BY t.id ASC
    `;
    db.query(query, callback);
  },

  findById: (id, callback) => {
    db.query("SELECT * FROM teams WHERE id = ?", [id], callback);
  },

  findByName: (name, callback) => {
    db.query("SELECT * FROM teams WHERE name = ?", [name], callback);
  },

  assignLeader: (teamId, leaderId, callback) => {
    db.query(
      "UPDATE teams SET leader_id = ? WHERE id = ?",
      [leaderId, teamId],
      callback
    );
  },

  update: (teamId, teamData, callback) => {
    db.query("UPDATE teams SET ? WHERE id = ?", [teamData, teamId], callback);
  },

  delete: (teamId, callback) => {
    db.query("DELETE FROM teams WHERE id = ?", [teamId], callback);
  },

  findMembersByTeamId: (teamId, callback) => {
    db.query(
      "SELECT id, name, email, jobTitle, role, team_id FROM users WHERE team_id = ?",
      [teamId],
      callback
    );
  },
};

module.exports = Team;
