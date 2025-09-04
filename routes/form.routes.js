const express = require("express");
const {
  createForm,
  getAllForms,
  getFormById,
  getFormsByTeamId,
  updateForm,
  deleteForm,
  getAllPeerEvaluationForms,
} = require("../controllers/form.controller");

const { verifyToken } = require("../middlewares/auth.middleware");

const router = express.Router();

// ------------------ MIDDLEWARE ------------------
const canManageForms = (req, res, next) => {
  if (["admin", "team_manager", "team_leader"].includes(req.userRole))
    return next();
  return res.status(403).json({ message: "Access denied" });
};

// ------------------ ROUTES ------------------

// Create a form (admin or team_manager)
router.post(
  "/",
  verifyToken,
  (req, res, next) => {
    if (["admin", "team_manager"].includes(req.userRole)) return next();
    return res.status(403).json({ message: "Access denied" });
  },
  createForm
);

// Get all forms (any authenticated user)
router.get("/", verifyToken, getAllForms);

// Get all peer evaluation forms
router.get("/peer-evaluations", verifyToken, getAllPeerEvaluationForms);

// Get forms by team ID
router.get("/team/:teamId", verifyToken, getFormsByTeamId);

// Get a form by ID
router.get("/:id", verifyToken, getFormById);

// Update a form (admin, team_manager, team_leader)
router.put("/:id", verifyToken, canManageForms, updateForm);

// Delete a form (admin, team_manager, team_leader)
router.delete("/:id", verifyToken, canManageForms, deleteForm);

module.exports = router;
