const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { getJwtSecret } = require("../utils/jwtSecret");

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id);

    if (!user || user.status === "blocked") {
      return res.status(401).json({ message: "Account is not active." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
});

function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

function approvedDoctorOnly(req, res, next) {
  if (!req.user?.doctorProfile?.enabled || req.user.doctorProfile.approvalStatus !== "approved") {
    return res.status(403).json({ message: "Approved doctor access required." });
  }
  next();
}

module.exports = { protect, adminOnly, approvedDoctorOnly };
