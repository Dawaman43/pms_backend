const Team = require("../models/team.model");
const db = require("../configs/db.config");

// ================= CREATE TEAM =================
const createTeam = (req, res, next) => {
  if (!["admin", "team_leader"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to create teams" });
  }

  const { name, description, leader_id, department_id, memberIds } = req.body;

  if (!name || !leader_id) {
    return res
      .status(400)
      .json({ message: "Team name and leader_id are required" });
  }

  const checkMembersQuery = `
    SELECT id, name FROM users 
    WHERE id IN (?) AND team_id IS NOT NULL
  `;

  const assignMembers = (teamId) => {
    if (!memberIds || memberIds.length === 0) {
      return getTeamByIdResponse(teamId, res);
    }

    const assignQuery = "UPDATE users SET team_id = ? WHERE id IN (?)";
    db.query(assignQuery, [teamId, memberIds], (err) => {
      if (err)
        return res.status(500).json({ message: "Error assigning members" });
      getTeamByIdResponse(teamId, res);
    });
  };

  if (memberIds && memberIds.length > 0) {
    db.query(checkMembersQuery, [memberIds], (err, assigned) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (assigned.length > 0) {
        return res.status(400).json({
          message: `Members already in a team: ${assigned
            .map((m) => m.name)
            .join(", ")}`,
        });
      }
      Team.create(
        { name, description, leader_id, department_id: department_id || null },
        (err, result) => {
          if (err)
            return res.status(500).json({ message: "Error creating team" });
          assignMembers(result.insertId);
        }
      );
    });
  } else {
    Team.create(
      { name, description, leader_id, department_id: department_id || null },
      (err, result) => {
        if (err)
          return res.status(500).json({ message: "Error creating team" });
        assignMembers(result.insertId);
      }
    );
  }
};

// ================= GET ALL TEAMS =================
const getAllTeams = (req, res, next) => {
  const query = `
    SELECT t.id, t.name, t.description, t.created_at,
           u.name AS leaderName,
           d.name AS departmentName,
           COALESCE(
             (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name))
              FROM users WHERE team_id = t.id),
             JSON_ARRAY()
           ) AS members
    FROM teams t
    LEFT JOIN users u ON t.leader_id = u.id
    LEFT JOIN departments d ON t.department_id = d.id
    ORDER BY t.id ASC
  `;

  db.query(query, (err, teams) => {
    if (err) return res.status(500).json({ message: "Error fetching teams" });

    const teamsWithCount = teams.map((team) => ({
      ...team,
      membersCount: Array.isArray(team.members) ? team.members.length : 0,
    }));

    res.json(teamsWithCount);
  });
};

// ================= GET TEAM BY ID =================
const getTeamByIdResponse = (teamId, res) => {
  const query = `
    SELECT t.id, t.name, t.description, t.created_at,
           u.name AS leaderName,
           d.name AS departmentName,
           COALESCE(
             (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name))
              FROM users WHERE team_id = t.id),
             JSON_ARRAY()
           ) AS members
    FROM teams t
    LEFT JOIN users u ON t.leader_id = u.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.id = ? LIMIT 1
  `;

  db.query(query, [teamId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching team" });
    if (!results.length)
      return res.status(404).json({ message: "Team not found" });

    const team = results[0];
    team.membersCount = Array.isArray(team.members) ? team.members.length : 0;
    res.json(team);
  });
};

const getTeamById = (req, res, next) => {
  const teamId = parseInt(req.params.id);
  getTeamByIdResponse(teamId, res);
};

// ================= UPDATE TEAM =================
const updateTeam = (req, res, next) => {
  if (!["admin", "team_leader"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to update teams" });
  }

  const teamId = parseInt(req.params.id);
  const { name, description, leader_id, department_id, memberIds } = req.body;

  const updateTeamDB = () => {
    Team.update(
      teamId,
      { name, description, leader_id, department_id: department_id || null },
      (err) => {
        if (err)
          return res.status(500).json({ message: "Error updating team" });

        if (!memberIds || memberIds.length === 0) {
          return db.query(
            "UPDATE users SET team_id = NULL WHERE team_id = ?",
            [teamId],
            (err2) => {
              if (err2)
                return res
                  .status(500)
                  .json({ message: "Error removing members" });
              getTeamByIdResponse(teamId, res);
            }
          );
        }

        // Remove members no longer in team
        db.query(
          "UPDATE users SET team_id = NULL WHERE team_id = ? AND id NOT IN (?)",
          [teamId, memberIds],
          (err1) => {
            if (err1)
              return res
                .status(500)
                .json({ message: "Error removing old members" });

            // Assign new members
            db.query(
              "UPDATE users SET team_id = ? WHERE id IN (?)",
              [teamId, memberIds],
              (err2) => {
                if (err2)
                  return res
                    .status(500)
                    .json({ message: "Error assigning members" });
                getTeamByIdResponse(teamId, res);
              }
            );
          }
        );
      }
    );
  };

  if (memberIds && memberIds.length > 0) {
    const checkQuery =
      "SELECT id, name FROM users WHERE id IN (?) AND (team_id IS NOT NULL AND team_id != ?)";
    db.query(checkQuery, [memberIds, teamId], (err, assigned) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (assigned.length > 0) {
        return res.status(400).json({
          message: `Members already in another team: ${assigned
            .map((m) => m.name)
            .join(", ")}`,
        });
      }
      updateTeamDB();
    });
  } else updateTeamDB();
};

// ================= DELETE TEAM =================
const deleteTeam = (req, res, next) => {
  if (!["admin", "team_leader"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to delete teams" });
  }

  const teamId = parseInt(req.params.id);
  db.query(
    "UPDATE users SET team_id = NULL WHERE team_id = ?",
    [teamId],
    (err) => {
      if (err)
        return res.status(500).json({ message: "Error clearing team members" });

      Team.delete(teamId, (err2) => {
        if (err2)
          return res.status(500).json({ message: "Error deleting team" });
        res.json({ message: "Team deleted successfully" });
      });
    }
  );
};

// ================= GET TEAM MEMBERS BY USER ID =================
const getTeamMembersByUserId = (req, res, next) => {
  const userId = parseInt(req.params.userId);
  db.query(
    "SELECT team_id FROM users WHERE id = ?",
    [userId],
    (err, userRes) => {
      if (err)
        return res.status(500).json({ message: "Error fetching user team" });
      if (!userRes.length || !userRes[0].team_id)
        return res.status(404).json({ message: "User has no team assigned" });

      const teamId = userRes[0].team_id;
      if (req.userRole === "staff" && req.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this team" });
      }

      db.query(
        "SELECT id, name, email, jobTitle FROM users WHERE team_id = ?",
        [teamId],
        (err2, members) => {
          if (err2)
            return res
              .status(500)
              .json({ message: "Error fetching team members" });
          res.json({ teamId, members, membersCount: members.length });
        }
      );
    }
  );
};

// ================= GET MY TEAM MEMBERS (PEERS) =================
const getMyTeamMembers = (req, res, next) => {
  const userId = req.userId; // logged-in user

  // Find the team of the logged-in user
  db.query(
    "SELECT team_id FROM users WHERE id = ?",
    [userId],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Error fetching user team" });
      if (!result.length || !result[0].team_id) {
        return res
          .status(404)
          .json({ message: "You are not assigned to any team" });
      }

      const teamId = result[0].team_id;

      // Fetch all team members except the logged-in user, including department
      db.query(
        `SELECT u.id, u.name, u.email, u.jobTitle, d.name AS department_name
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.team_id = ? AND u.id != ?`,
        [teamId, userId],
        (err2, members) => {
          if (err2)
            return res
              .status(500)
              .json({ message: "Error fetching team members" });

          res.json({
            teamId,
            peers: members,
            peersCount: members.length,
          });
        }
      );
    }
  );
};

module.exports = {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembersByUserId,
  getMyTeamMembers,
};
