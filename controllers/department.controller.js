const db = require("../configs/db.config");

const Department = require("../models/department.model");

// Create department (Admin only)
const createDepartment = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res
      .status(403)
      .json({ message: "Admins only can create departments" });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Department name is required" });
  }

  Department.create(req.body, (err, result) => {
    if (err) return next(new Error("Error creating department"));
    res.json({
      message: "Department created successfully",
      id: result.insertId,
    });
  });
};

const getAllDepartments = (req, res, next) => {
  Department.findAll((err, results) => {
    if (err) return next(new Error("Error fetching departments"));
    res.json(results);
  });
};

// Get department by ID (Admins only)
const getDepartmentById = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admins only can view department" });
  }

  Department.findById(req.params.id, (err, results) => {
    if (err) return next(new Error("Error fetching department"));
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.json(results[0]);
  });
};

// Update department (Admins only)
const updateDepartment = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res
      .status(403)
      .json({ message: "Admins only can update departments" });
  }

  Department.update(req.params.id, req.body, (err) => {
    if (err) return next(new Error("Error updating department"));
    res.json({ message: "Department updated successfully" });
  });
};

// Delete department (Admins only)
const deleteDepartment = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res
      .status(403)
      .json({ message: "Admins only can delete departments" });
  }

  Department.delete(req.params.id, (err) => {
    if (err) return next(new Error("Error deleting department"));
    res.json({ message: "Department deleted successfully" });
  });
};

const getTeamLeadersByDepartment = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res
      .status(403)
      .json({ message: "Admins only can view team leaders" });
  }

  const departmentId = parseInt(req.params.id);

  const query = `
    SELECT id, name, email, role
    FROM users
    WHERE department_id = ? AND role = 'team_leader'
  `;

  db.query(query, [departmentId], (err, results) => {
    if (err) {
      console.error("SQL ERROR in getTeamLeadersByDepartment:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    res.json(results);
  });
};

// In department.controller.js
const getStaffByDepartment = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }

  const departmentId = parseInt(req.params.id);

  const query = `
    SELECT id, name, email, role
    FROM users
    WHERE department_id = ? AND role = 'staff'
  `;

  db.query(query, [departmentId], (err, results) => {
    if (err) return res.status(500).json({ message: "Internal server error" });
    res.json(results);
  });
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getTeamLeadersByDepartment,
  getStaffByDepartment,
};
