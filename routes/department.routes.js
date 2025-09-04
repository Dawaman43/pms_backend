const express = require("express");
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getTeamLeadersByDepartment,
  getStaffByDepartment,
} = require("../controllers/department.controller");

const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", verifyToken, getAllDepartments);
router.get("/:id", verifyToken, getDepartmentById);
router.get("/:id/leaders", verifyToken, getTeamLeadersByDepartment);
router.get("/:id/staff", verifyToken, getStaffByDepartment);

router.post("/", verifyToken, isAdmin, createDepartment);
router.put("/:id", verifyToken, isAdmin, updateDepartment);
router.delete("/:id", verifyToken, isAdmin, deleteDepartment);

module.exports = router;
