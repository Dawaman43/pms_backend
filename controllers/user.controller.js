const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const db = require("../configs/db.config");

// ================= REGISTER USER =================
const register = (req, res, next) => {
  if (!["admin", "team_leader"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to create users" });
  }

  const {
    name,
    jobTitle,
    level,
    email,
    team, // team name
    phone,
    address,
    emergencyContact,
    salary,
    profileImage,
    role,
    password,
  } = req.body;

  if (!name || !email || !password) {
    return next(new Error("Name, email, and password are required"));
  }

  // Check if email exists
  User.findByEmail(email, (err, results) => {
    if (err) return next(new Error("Error checking email"));
    if (results.length > 0) return next(new Error("Email already exists"));

    // Lookup team by name
    const getTeamId = (cb) => {
      if (!team) return cb(null, null);
      db.query(
        "SELECT id FROM teams WHERE name = ?",
        [team],
        (err, teamResults) => {
          if (err) return cb(new Error("Error finding team"));
          if (teamResults.length > 0) return cb(null, teamResults[0].id);
          return cb(null, null);
        }
      );
    };

    getTeamId((err, team_id) => {
      if (err) return next(err);

      const userData = {
        name,
        jobTitle,
        level,
        email,
        password: bcrypt.hashSync(password, 8),
        team_id,
        phone,
        address,
        emergencyContact,
        salary: salary ? parseFloat(salary) : null,
        profileImage,
        role: role || "staff",
        dateRegistered: new Date().toISOString().split("T")[0],
        status: "active",
      };

      User.create(userData, (err, result) => {
        if (err)
          return next(new Error("Error registering user: " + err.message));
        res.json({
          message: "User registered successfully",
          userId: result.insertId,
        });
      });
    });
  });
};

// ================= GET ALL USERS =================
const getAllUsers = (req, res, next) => {
  const { role } = req.query;

  let query = `
    SELECT u.*, t.name AS teamName
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (req.userRole === "staff") {
    query += " AND u.team_id = (SELECT team_id FROM users WHERE id = ?)";
    params.push(req.userId);
  }

  if (role) {
    query += " AND u.role = ?";
    params.push(role);
  }

  db.query(query, params, (err, results) => {
    if (err) return next(new Error("Error fetching users"));
    res.json(results || []);
  });
};

// ================= GET USER BY ID =================
const getUserById = (req, res, next) => {
  const userId = parseInt(req.params.id);

  if (req.userRole === "staff" && req.userId !== userId) {
    return res
      .status(403)
      .json({ message: "Not authorized to view this user" });
  }

  const query = `
    SELECT u.*, t.name AS teamName
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    WHERE u.id = ?
    LIMIT 1
  `;

  db.query(query, [userId], (err, results) => {
    if (err || results.length === 0) return next(new Error("User not found"));
    res.json(results[0]);
  });
};

// ================= UPDATE USER =================
const updateUser = (req, res, next) => {
  const userId = parseInt(req.params.id);

  if (req.userRole === "staff" && req.userId !== userId) {
    return res
      .status(403)
      .json({ message: "Not authorized to update this user" });
  }

  const {
    name,
    jobTitle,
    level,
    email,
    team_id,
    phone,
    address,
    emergencyContact,
    salary,
    profileImage,
    role,
    status,
  } = req.body;

  const userData = {};
  if (name) userData.name = name;
  if (jobTitle) userData.jobTitle = jobTitle;
  if (level) userData.level = level;
  if (email) userData.email = email;
  if (team_id !== undefined) {
    const tid = parseInt(team_id);
    userData.team_id = !isNaN(tid) ? tid : null;
  }
  if (phone !== undefined) userData.phone = phone || null;
  if (address !== undefined) userData.address = address || null;
  if (emergencyContact !== undefined)
    userData.emergencyContact = emergencyContact || null;
  if (salary !== undefined)
    userData.salary = !isNaN(parseFloat(salary)) ? parseFloat(salary) : null;
  if (profileImage !== undefined) userData.profileImage = profileImage || null;

  if (["admin", "team_leader"].includes(req.userRole)) {
    if (role) userData.role = role;
    if (status) userData.status = status;
  }

  if (Object.keys(userData).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  User.updateUser(userId, userData, (err) => {
    if (err) return res.status(500).json({ error: "Error updating user" });
    res.json({ message: "User updated successfully" });
  });
};

// ================= UPDATE PASSWORD =================
const updatePassword = (req, res, next) => {
  const userId = parseInt(req.params.id);

  if (
    req.userId !== userId &&
    !["admin", "team_leader"].includes(req.userRole)
  ) {
    return res
      .status(403)
      .json({ message: "Not authorized to update this password" });
  }

  const { oldPassword, newPassword } = req.body;
  if (!newPassword)
    return res.status(400).json({ error: "New password is required" });
  if (newPassword.length < 8)
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters long" });

  if (
    ["admin", "team_leader"].includes(req.userRole) &&
    req.userId !== userId
  ) {
    const hashedPassword = bcrypt.hashSync(newPassword, 8);
    db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId],
      (err) => {
        if (err)
          return res.status(500).json({ error: "Error updating password" });
        res.json({ message: "Password updated successfully" });
      }
    );
  } else {
    if (!oldPassword)
      return res.status(400).json({ error: "Old password is required" });
    User.updatePassword(userId, oldPassword, newPassword, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Password updated successfully" });
    });
  }
};

// ================= DELETE USER =================
const deleteUser = (req, res, next) => {
  if (!["admin", "team_leader"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to delete users" });
  }

  const userId = parseInt(req.params.id);
  User.delete(userId, (err) => {
    if (err) return next(new Error("Error deleting user"));
    res.json({ message: "User deleted successfully" });
  });
};

// ================= GET ALL USERS EXCEPT CURRENT =================
const getAllUsersExceptCurrent = (req, res) => {
  db.query(
    "SELECT team_id FROM users WHERE id = ?",
    [req.userId],
    (err, userResults) => {
      if (err) {
        console.error("Error fetching user's team:", err);
        return res.status(500).json({ message: "Error fetching user's team" });
      }

      const teamId = userResults[0]?.team_id;
      if (!teamId) return res.json([]);

      db.query(
        "SELECT id, name, role FROM users WHERE team_id = ? AND id != ? AND status = 'active'",
        [teamId, req.userId],
        (err, results) => {
          if (err) {
            console.error("Error fetching team peers:", err);
            return res
              .status(500)
              .json({ message: "Error fetching team peers" });
          }
          res.json(results || []);
        }
      );
    }
  );
};

module.exports = {
  register,
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
  getAllUsersExceptCurrent,
};
