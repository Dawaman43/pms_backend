const express = require("express");
const {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembersByUserId,
  getMyTeamMembers,
  getTeamMembers, // ✅ import new function
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
// Order matters: more specific routes before generic ones
router.get("/", verifyToken, getAllTeams);

// 🔹 Members
router.get("/members/:userId", verifyToken, getTeamMembersByUserId); // any user can see by userId (with restrictions inside controller)
router.get("/my-team", verifyToken, getMyTeamMembers); // logged-in user's peers
router.get("/my-team/full", verifyToken, isAdminOrTeamLeader, getTeamMembers); // ✅ new route for leaders/admins

// --- Single team
router.get("/:id", verifyToken, getTeamById);

module.exports = router;
