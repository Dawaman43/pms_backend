const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// Admin only
const isAdmin = (req, res, next) => {
  if (req.userRole !== "admin")
    return res.status(403).json({ message: "Access denied: Admins only" });
  next();
};

// Staff only
const isStaff = (req, res, next) => {
  if (req.userRole !== "staff")
    return res.status(403).json({ message: "Access denied: Staff only" });
  next();
};

// Team Manager only
const isTeamManager = (req, res, next) => {
  if (req.userRole !== "team_manager")
    return res
      .status(403)
      .json({ message: "Access denied: Team Managers only" });
  next();
};

// Admin or Team Manager
const isAdminOrTeamManager = (req, res, next) => {
  if (!["admin", "team_manager"].includes(req.userRole))
    return res
      .status(403)
      .json({ message: "Access denied: Admin or Team Manager only" });
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isStaff,
  isTeamManager,
  isAdminOrTeamManager,
};
