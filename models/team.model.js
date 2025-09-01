const db = require("../configs/db.config");

const Team = {
  // Create a new team
  create: (teamData, callback) => {
    db.query("INSERT INTO teams SET ?", teamData, callback);
  },

  // Fetch all teams (basic, for admin use)
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

  // Fetch team by ID
  findById: (id, callback) => {
    db.query("SELECT * FROM teams WHERE id = ?", [id], callback);
  },

  // Fetch team by name
  findByName: (name, callback) => {
    db.query("SELECT * FROM teams WHERE name = ?", [name], callback);
  },

  // Assign leader to a team
  assignLeader: (teamId, leaderId, callback) => {
    db.query(
      "UPDATE teams SET leader_id = ? WHERE id = ?",
      [leaderId, teamId],
      callback
    );
  },

  // Update a team
  update: (teamId, teamData, callback) => {
    db.query("UPDATE teams SET ? WHERE id = ?", [teamData, teamId], callback);
  },

  // Delete a team
  delete: (teamId, callback) => {
    db.query("DELETE FROM teams WHERE id = ?", [teamId], callback);
  },

  // Fetch members of a team
  findMembersByTeamId: (teamId, callback) => {
    db.query(
      "SELECT id, name, email, jobTitle, role, team_id FROM users WHERE team_id = ?",
      [teamId],
      callback
    );
  },
};

module.exports = Team;
