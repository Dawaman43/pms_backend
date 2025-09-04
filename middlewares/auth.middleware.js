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

const isAdmin = (req, res, next) => {
  if (req.userRole !== "admin")
    return res.status(403).json({ message: "Admins only" });
  next();
};

const isTeamLeader = (req, res, next) => {
  if (req.userRole !== "team_leader")
    return res.status(403).json({ message: "Team Leaders only" });
  next();
};

const isAdminOrTeamLeader = (req, res, next) => {
  if (!["admin", "team_leader"].includes(req.userRole)) {
    return res.status(403).json({ message: "Admins or Team Leaders only" });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isTeamLeader,
  isAdminOrTeamLeader,
};
