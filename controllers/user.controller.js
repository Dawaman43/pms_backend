const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const Team = require("../models/team.model");
const db = require("../configs/db.config");

// ================= REGISTER USER =================
const register = async (req, res, next) => {
  if (!["admin", "team_manager"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to create users" });
  }

  const {
    name,
    jobTitle,
    level,
    email,
    department_id, // Expect department_id instead of department
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

  // Check if email already exists
  User.findByEmail(email, async (err, results) => {
    if (err) return next(new Error("Error checking email"));
    if (results.length > 0) return next(new Error("Email already exists"));

    let team_id = null;

    // Lookup team by name
    const getTeamId = () => {
      return new Promise((resolve, reject) => {
        if (!team) return resolve(null);
        db.query(
          "SELECT id FROM teams WHERE name = ?",
          [team],
          (err, teamResults) => {
            if (err) return reject(new Error("Error finding team"));
            if (teamResults.length > 0) resolve(teamResults[0].id);
            else resolve(null);
          }
        );
      });
    };

    try {
      team_id = await getTeamId();

      // Validate department_id
      if (department_id) {
        const deptResults = await new Promise((resolve, reject) => {
          db.query(
            "SELECT id FROM departments WHERE id = ?",
            [department_id],
            (err, results) => {
              if (err) return reject(new Error("Error finding department"));
              resolve(results);
            }
          );
        });
        if (deptResults.length === 0) {
          return next(new Error("Invalid department_id"));
        }
      }

      const userData = {
        name,
        jobTitle,
        level,
        email,
        password: bcrypt.hashSync(password, 8),
        department_id: department_id || null,
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
    } catch (error) {
      return next(error);
    }
  });
};

// ================= GET ALL USERS =================
const getAllUsers = (req, res, next) => {
  const { department, role } = req.query;

  let query = `
    SELECT u.*, t.name AS teamName, d.name AS departmentName
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  // Staff can only see their own team
  if (req.userRole === "staff") {
    query += " AND u.team_id = (SELECT team_id FROM users WHERE id = ?)";
    params.push(req.userId);
  }

  if (department) {
    query += " AND d.name = ?";
    params.push(department);
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
    SELECT u.*, t.name AS teamName, d.name AS departmentName
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    LEFT JOIN departments d ON u.department_id = d.id
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
    department,
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
  if (department !== undefined) userData.department = department || null;
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

  if (["admin", "team_manager"].includes(req.userRole)) {
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
    !["admin", "team_manager"].includes(req.userRole)
  ) {
    return res
      .status(403)
      .json({ message: "Not authorized to update this password" });
  }

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Old and new password are required" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters long" });
  }

  User.updatePassword(userId, oldPassword, newPassword, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: "Password updated successfully" });
  });
};

// ================= DELETE USER =================
const deleteUser = (req, res, next) => {
  if (!["admin", "team_manager"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to delete users" });
  }

  const userId = parseInt(req.params.id);
  User.delete(userId, (err) => {
    if (err) return next(new Error("Error deleting user"));
    res.json({ message: "User deleted successfully" });
  });
};

module.exports = {
  register,
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
};
