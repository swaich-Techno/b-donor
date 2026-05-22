const express = require("express");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/apply", protect, asyncHandler(async (req, res) => {
  req.user.hospitalProfile = {
    ...(req.user.hospitalProfile.toObject?.() || req.user.hospitalProfile),
    ...req.body,
    enabled: true,
    approvalStatus: "pending",
    rejectionReason: ""
  };
  req.user.accountType = req.user.accountType === "patient" ? "hospital" : req.user.accountType;
  await req.user.save();
  res.json({ user: req.user.toSafeJSON(), message: "Hospital profile submitted for admin approval." });
}));

router.put("/profile", protect, asyncHandler(async (req, res) => {
  if (!req.user.hospitalProfile?.enabled) {
    return res.status(400).json({ message: "Apply as hospital first." });
  }

  req.user.hospitalProfile = {
    ...(req.user.hospitalProfile.toObject?.() || req.user.hospitalProfile),
    ...req.body,
    enabled: true
  };
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}));

router.get("/nearby", protect, asyncHandler(async (req, res) => {
  const { lat, lng, radiusKm = 20 } = req.query;
  const filter = {
    "hospitalProfile.enabled": true,
    "hospitalProfile.approvalStatus": "approved",
    status: { $ne: "blocked" }
  };

  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusKm) * 1000
      }
    };
  }

  const hospitals = await User.find(filter)
    .select("name phone location.city location.district hospitalProfile")
    .limit(50);
  res.json({ hospitals });
}));

router.get("/search", protect, asyncHandler(async (req, res) => {
  const { city, district, department, bloodBankAvailable } = req.query;
  const filter = {
    "hospitalProfile.enabled": true,
    "hospitalProfile.approvalStatus": "approved",
    status: { $ne: "blocked" }
  };

  if (city) filter["location.city"] = new RegExp(String(city), "i");
  if (district) filter["location.district"] = new RegExp(String(district), "i");
  if (department) filter["hospitalProfile.departments"] = new RegExp(String(department), "i");
  if (bloodBankAvailable !== undefined) filter["hospitalProfile.bloodBankAvailable"] = String(bloodBankAvailable) === "true";

  const hospitals = await User.find(filter)
    .select("name phone location hospitalProfile")
    .sort({ "hospitalProfile.verifiedBadge": -1, "hospitalProfile.hospitalName": 1 })
    .limit(100);

  res.json({ hospitals });
}));

router.get("/:id", protect, asyncHandler(async (req, res) => {
  const hospital = await User.findOne({
    _id: req.params.id,
    "hospitalProfile.enabled": true,
    "hospitalProfile.approvalStatus": "approved",
    status: { $ne: "blocked" }
  }).select("name phone location hospitalProfile");
  if (!hospital) return res.status(404).json({ message: "Hospital not found." });
  res.json({ hospital });
}));

module.exports = router;
