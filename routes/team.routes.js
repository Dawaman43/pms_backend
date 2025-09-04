const express = require("express");
const {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembersByUserId,
} = require("../controllers/team.controller");

const {
  verifyToken,
  isAdminOrTeamLeader,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// --- Create, update, delete teams (admin or team leader) ---
router.post("/", verifyToken, isAdminOrTeamLeader, createTeam);
router.put("/:id", verifyToken, isAdminOrTeamLeader, updateTeam);
router.delete("/:id", verifyToken, isAdminOrTeamLeader, deleteTeam);

// --- Get teams or members (any authenticated user) ---
// Note: specific routes must come before generic ones
router.get("/", verifyToken, getAllTeams);
router.get("/members/:userId", verifyToken, getTeamMembersByUserId);
router.get("/:id", verifyToken, getTeamById);

module.exports = router;
