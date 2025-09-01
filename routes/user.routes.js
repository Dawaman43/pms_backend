const express = require("express");
const multer = require("multer");
const {
  register,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updatePassword,
} = require("../controllers/user.controller");

const {
  verifyToken,
  isAdmin,
  isTeamManager,
  isAdminOrTeamManager,
} = require("../middlewares/auth.middleware");

const User = require("../models/user.model");

const router = express.Router();

// Multer setup for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/profile-pictures/"),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `user-${req.params.id}.${ext}`);
  },
});
const upload = multer({ storage });

// Create user: admin or team_manager
router.post("/", verifyToken, isAdminOrTeamManager, register);

// Get all users: admin or team_manager
router.get("/", verifyToken, isAdminOrTeamManager, getAllUsers);

// Get single user: any authenticated user
router.get("/:id", verifyToken, getUserById);

// Update user: any authenticated user (controller checks permissions)
router.put("/:id", verifyToken, updateUser);

// Update password
router.put("/:id/password", verifyToken, updatePassword);

// Delete user: admin only
router.delete("/:id", verifyToken, isAdmin, deleteUser);

// Upload profile picture
router.post(
  "/:id/profile-picture",
  verifyToken,
  upload.single("profilePicture"),
  (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const profileImage = `${req.protocol}://${req.get(
        "host"
      )}/uploads/profile-pictures/${req.file.filename}`;

      User.updateUser(req.params.id, { profileImage }, (err) => {
        if (err) return next(new Error("Error updating profile picture"));
        res.json({ message: "Profile picture updated", profileImage });
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
