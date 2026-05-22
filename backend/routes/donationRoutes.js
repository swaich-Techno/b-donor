const express = require("express");
const BloodDonation = require("../models/BloodDonation");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", protect, asyncHandler(async (req, res) => {
  const donations = await BloodDonation.find({ donorId: req.user._id })
    .populate("bloodRequestId", "patientName hospitalName bloodGroupRequired status")
    .sort({ donationDate: -1, createdAt: -1 });
  res.json({ donations });
}));

router.post("/", protect, asyncHandler(async (req, res) => {
  if (!req.user.isAdmin && !req.user.hospitalProfile?.enabled) {
    return res.status(403).json({ message: "Only admin or hospital users can record donation completion." });
  }

  const donation = await BloodDonation.create(req.body);
  res.status(201).json({ donation });
}));

module.exports = router;
