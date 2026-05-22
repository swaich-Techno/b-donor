const express = require("express");
const DonorAlert = require("../models/DonorAlert");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const { searchMatchingDonors } = require("../services/donorMatchingService");

const router = express.Router();

router.post("/activate", protect, asyncHandler(async (req, res) => {
  if (!req.user.bloodGroup && !req.body.bloodGroup) {
    return res.status(400).json({ message: "Blood group is required to activate donor profile." });
  }

  if (!req.body.donorConsentAccepted && !req.user.consent?.donorConsentAccepted) {
    return res.status(400).json({ message: "Donor consent is required before donor approval." });
  }

  req.user.bloodGroup = req.body.bloodGroup || req.user.bloodGroup;
  req.user.donorProfile = {
    ...(req.user.donorProfile.toObject?.() || req.user.donorProfile),
    enabled: true,
    approvalStatus: "pending",
    isAvailable: false,
    preferredRadiusKm: req.body.preferredRadiusKm || req.user.donorProfile.preferredRadiusKm || 10,
    canReceiveWhatsApp: req.body.canReceiveWhatsApp !== false,
    canReceiveSMS: Boolean(req.body.canReceiveSMS),
    emergencyAvailability: Boolean(req.body.emergencyAvailability),
    healthEligibilityStatus: req.body.healthEligibilityStatus || "needs_review",
    rejectionReason: ""
  };
  req.user.accountType = req.user.accountType === "patient" ? "donor" : req.user.accountType;
  req.user.consent.donorConsentAccepted = true;
  req.user.consent.whatsappSmsConsentAccepted = Boolean(req.body.whatsappSmsConsentAccepted);
  await req.user.save();

  res.json({ user: req.user.toSafeJSON(), message: "Donor profile submitted for admin approval." });
}));

router.put("/profile", protect, asyncHandler(async (req, res) => {
  const donorFields = [
    "lastDonationDate",
    "preferredRadiusKm",
    "canReceiveWhatsApp",
    "canReceiveSMS",
    "emergencyAvailability",
    "healthEligibilityStatus"
  ];

  donorFields.forEach((field) => {
    if (req.body[field] !== undefined) req.user.donorProfile[field] = req.body[field];
  });

  if (req.body.bloodGroup) req.user.bloodGroup = req.body.bloodGroup;
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}));

router.put("/availability", protect, asyncHandler(async (req, res) => {
  if (!req.user.donorProfile?.enabled) {
    return res.status(400).json({ message: "Activate donor profile first." });
  }

  if (req.user.donorProfile.approvalStatus !== "approved") {
    return res.status(403).json({ message: "Admin approval is required before enabling availability." });
  }

  if (req.body.isAvailable && req.user.donorProfile.cooldownUntil && req.user.donorProfile.cooldownUntil > new Date()) {
    return res.status(403).json({
      message: "Recovery cooldown is active. You cannot appear in donor matching yet.",
      cooldownUntil: req.user.donorProfile.cooldownUntil,
      nextEligibleDonationDate: req.user.donorProfile.nextEligibleDonationDate
    });
  }

  req.user.donorProfile.isAvailable = Boolean(req.body.isAvailable);
  if (!req.user.donorProfile.isAvailable) {
    req.user.donorProfile.temporaryUnavailableReason = req.body.reason || req.user.donorProfile.temporaryUnavailableReason;
  } else {
    req.user.donorProfile.temporaryUnavailableReason = "";
  }
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}));

router.get("/alerts", protect, asyncHandler(async (req, res) => {
  const alerts = await DonorAlert.find({ donorId: req.user._id })
    .populate("bloodRequestId", "bloodGroupRequired urgency hospitalName city district searchRadiusKm status")
    .sort({ createdAt: -1 });
  res.json({ alerts });
}));

router.get("/search", protect, asyncHandler(async (req, res) => {
  const { bloodGroup, lat, lng, radiusKm = 5, urgency = "normal" } = req.query;

  if (!bloodGroup || !lat || !lng) {
    return res.status(400).json({ message: "bloodGroup, lat, and lng are required." });
  }

  const matches = await searchMatchingDonors({
    bloodGroupRequired: bloodGroup,
    coordinates: [Number(lng), Number(lat)],
    radiusKm: Number(radiusKm),
    urgency,
    allowCompatibleInEmergency: urgency === "critical"
  });

  const donors = matches.allMatches.map((match) => ({
    id: match.donorId,
    name: match.donor.name,
    bloodGroup: match.donorBloodGroup,
    matchType: match.matchType,
    distanceKm: match.distanceKm,
    city: match.donor.location?.city,
    district: match.donor.location?.district
  }));

  res.json({ donors });
}));

module.exports = router;
