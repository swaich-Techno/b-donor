const express = require("express");
const DonorCoinLedger = require("../models/DonorCoinLedger");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { adminOnly, protect } = require("../middleware/auth");

const router = express.Router();

const DISCLAIMER = "Donor Coin Impact Points are non-cash recognition points. They are not payment for blood donation, not cryptocurrency in Phase 1, not transferable, and have no monetary value.";

router.get("/wallet", protect, asyncHandler(async (req, res) => {
  res.json({
    wallet: req.user.donorCoin || { impactPoints: 0, level: "New Helper", badges: [] },
    completedDonations: req.user.donorProfile?.totalDonations || 0,
    livesSupportedEstimate: req.user.donorProfile?.totalDonations || 0,
    disclaimer: DISCLAIMER
  });
}));

router.get("/ledger", protect, asyncHandler(async (req, res) => {
  const ledger = await DonorCoinLedger.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ ledger, disclaimer: DISCLAIMER });
}));

router.post("/admin-adjust", protect, adminOnly, asyncHandler(async (req, res) => {
  const { userId, points, type = "admin_adjustment", description } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  user.donorCoin.impactPoints = Math.max(0, (user.donorCoin.impactPoints || 0) + Number(points || 0));
  if (!user.donorCoin.badges.includes("Community Recognition")) {
    user.donorCoin.badges.push("Community Recognition");
  }
  await user.save();

  const entry = await DonorCoinLedger.create({
    userId,
    points: Number(points || 0),
    type,
    description,
    hasCashValue: false,
    transferable: false
  });

  res.status(201).json({ entry, wallet: user.donorCoin, disclaimer: DISCLAIMER });
}));

module.exports = router;
