const express = require("express");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const { adminOnly, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, adminOnly, asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({})
    .populate("actorId", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ logs });
}));

module.exports = router;
