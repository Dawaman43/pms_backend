const express = require("express");
const {
  createForm,
  getAllForms,
  getFormById,
  updateForm,
  deleteForm,
} = require("../controllers/form.controller");

const {
  verifyToken,
  isAdmin,
  isTeamManager,
  isAdminOrTeamManager,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Create form: admin or team_manager
router.post("/", verifyToken, isAdminOrTeamManager, createForm);

// Get all forms: any authenticated user
router.get("/", verifyToken, getAllForms);

// Get form by ID: any authenticated user
router.get("/:id", verifyToken, getFormById);

// Update form: admin, team leader, or team_manager
router.put(
  "/:id",
  verifyToken,
  (req, res, next) => {
    if (["admin", "team_manager"].includes(req.userRole)) return next();
    if (req.userRole === "team_leader") return next();
    return res.status(403).json({ message: "Access denied" });
  },
  updateForm
);

// Delete form: admin, team leader, or team_manager
router.delete(
  "/:id",
  verifyToken,
  (req, res, next) => {
    if (["admin", "team_manager"].includes(req.userRole)) return next();
    if (req.userRole === "team_leader") return next();
    return res.status(403).json({ message: "Access denied" });
  },
  deleteForm
);

module.exports = router;
