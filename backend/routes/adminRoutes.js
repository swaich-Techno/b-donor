const express = require("express");
const BloodRequest = require("../models/BloodRequest");
const Certificate = require("../models/Certificate");
const DonationConsent = require("../models/DonationConsent");
const DonorAlert = require("../models/DonorAlert");
const DonorCoinLedger = require("../models/DonorCoinLedger");
const LiveTrackingSession = require("../models/LiveTrackingSession");
const Subscription = require("../models/Subscription");
const CSRPartner = require("../models/CSRPartner");
const AppointmentRequest = require("../models/AppointmentRequest");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { adminOnly, protect } = require("../middleware/auth");
const { createCertificate } = require("../services/certificateService");
const { logAudit } = require("../services/auditService");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/pending-approvals", asyncHandler(async (req, res) => {
  const [donors, doctors, hospitals] = await Promise.all([
    User.find({ "donorProfile.enabled": true, "donorProfile.approvalStatus": "pending" }).select("-password"),
    User.find({ "doctorProfile.enabled": true, "doctorProfile.approvalStatus": "pending" }).select("-password"),
    User.find({ "hospitalProfile.enabled": true, "hospitalProfile.approvalStatus": "pending" }).select("-password")
  ]);

  res.json({ donors, doctors, hospitals });
}));

async function updateApproval({ userId, profilePath, approvalStatus, rejectionReason }) {
  const user = await User.findById(userId);
  if (!user) return null;
  user[profilePath].approvalStatus = approvalStatus;
  user[profilePath].rejectionReason = rejectionReason || "";
  if (profilePath === "donorProfile" && approvalStatus !== "approved") {
    user.donorProfile.isAvailable = false;
  }
  if (profilePath === "doctorProfile" && approvalStatus === "approved") {
    user.doctorProfile.verifiedBadge = true;
    user.doctorProfile.appointmentEnabled = true;
  }
  if (profilePath === "hospitalProfile" && approvalStatus === "approved") {
    user.hospitalProfile.verifiedBadge = true;
    user.hospitalProfile.appointmentEnabled = true;
  }
  await user.save();
  return user;
}

router.post("/approve-donor/:userId", asyncHandler(async (req, res) => {
  const user = await updateApproval({ userId: req.params.userId, profilePath: "donorProfile", approvalStatus: "approved" });
  if (!user) return res.status(404).json({ message: "User not found." });
  const certificate = await createCertificate({ user, type: "verified_donor" });
  user.donorCoin = user.donorCoin || {};
  user.donorCoin.impactPoints = (user.donorCoin.impactPoints || 0) + 25;
  user.donorCoin.level = user.donorCoin.impactPoints >= 25 ? "Verified Donor" : "New Helper";
  user.donorCoin.badges = user.donorCoin.badges || [];
  if (!user.donorCoin.badges.includes("Verified Donor")) user.donorCoin.badges.push("Verified Donor");
  user.donorCoin.certificates.addToSet(certificate._id);
  await user.save();
  await DonorCoinLedger.create({
    userId: user._id,
    certificateId: certificate._id,
    points: 25,
    type: "profile_verified",
    description: "Non-cash recognition points for approved donor profile.",
    hasCashValue: false,
    transferable: false,
    withdrawable: false
  });
  await logAudit(req, { action: "approval.donor.approve", targetType: "User", targetId: user._id });
  res.json({ user: user.toSafeJSON(), certificate });
}));

router.post("/reject-donor/:userId", asyncHandler(async (req, res) => {
  const user = await updateApproval({
    userId: req.params.userId,
    profilePath: "donorProfile",
    approvalStatus: "rejected",
    rejectionReason: req.body.reason
  });
  if (!user) return res.status(404).json({ message: "User not found." });
  await logAudit(req, { action: "approval.donor.reject", targetType: "User", targetId: user._id, metadata: { reason: req.body.reason } });
  res.json({ user: user.toSafeJSON() });
}));

router.post("/approve-doctor/:userId", asyncHandler(async (req, res) => {
  const user = await updateApproval({ userId: req.params.userId, profilePath: "doctorProfile", approvalStatus: "approved" });
  if (!user) return res.status(404).json({ message: "User not found." });
  const certificate = await createCertificate({ user, type: "doctor_verified" });
  await logAudit(req, { action: "approval.doctor.approve", targetType: "User", targetId: user._id });
  res.json({ user: user.toSafeJSON(), certificate });
}));

router.post("/reject-doctor/:userId", asyncHandler(async (req, res) => {
  const user = await updateApproval({
    userId: req.params.userId,
    profilePath: "doctorProfile",
    approvalStatus: "rejected",
    rejectionReason: req.body.reason
  });
  if (!user) return res.status(404).json({ message: "User not found." });
  await logAudit(req, { action: "approval.doctor.reject", targetType: "User", targetId: user._id, metadata: { reason: req.body.reason } });
  res.json({ user: user.toSafeJSON() });
}));

router.post("/approve-hospital/:userId", asyncHandler(async (req, res) => {
  const user = await updateApproval({ userId: req.params.userId, profilePath: "hospitalProfile", approvalStatus: "approved" });
  if (!user) return res.status(404).json({ message: "User not found." });
  const certificate = await createCertificate({ user, type: "hospital_verified" });
  await logAudit(req, { action: "approval.hospital.approve", targetType: "User", targetId: user._id });
  res.json({ user: user.toSafeJSON(), certificate });
}));

router.post("/reject-hospital/:userId", asyncHandler(async (req, res) => {
  const user = await updateApproval({
    userId: req.params.userId,
    profilePath: "hospitalProfile",
    approvalStatus: "rejected",
    rejectionReason: req.body.reason
  });
  if (!user) return res.status(404).json({ message: "User not found." });
  await logAudit(req, { action: "approval.hospital.reject", targetType: "User", targetId: user._id, metadata: { reason: req.body.reason } });
  res.json({ user: user.toSafeJSON() });
}));

router.get("/analytics", asyncHandler(async (req, res) => {
  const [
    totalPatients,
    totalDonors,
    activeRequests,
    criticalRequests,
    alerts,
    donorsByBloodGroup,
    requestsByCity
  ] = await Promise.all([
    User.countDocuments({ isPatient: true }),
    User.countDocuments({ "donorProfile.enabled": true }),
    BloodRequest.countDocuments({ status: { $in: ["searching", "matched", "donor_accepted", "tracking", "arrived", "donated", "consent_pending"] } }),
    BloodRequest.countDocuments({ urgency: "critical", status: { $in: ["searching", "matched", "donor_accepted", "tracking"] } }),
    DonorAlert.find({}).select("status"),
    User.aggregate([
      { $match: { "donorProfile.enabled": true } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    BloodRequest.aggregate([
      { $group: { _id: { city: "$city", district: "$district" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  const acceptedAlerts = alerts.filter((alert) => alert.status === "accepted").length;
  const alertAcceptanceRate = alerts.length ? Math.round((acceptedAlerts / alerts.length) * 100) : 0;

  res.json({
    totalPatients,
    totalDonors,
    activeRequests,
    criticalRequests,
    alertAcceptanceRate,
    donorsByBloodGroup,
    requestsByCity,
    complaints: 0
  });
}));

router.get("/subscriptions", asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({})
    .populate("userId", "name email accountType")
    .populate("planId")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ subscriptions });
}));

router.get("/csr", asyncHandler(async (req, res) => {
  const partners = await CSRPartner.find({}).sort({ createdAt: -1 });
  res.json({ partners });
}));

router.get("/appointments", asyncHandler(async (req, res) => {
  const appointments = await AppointmentRequest.find({})
    .populate("patientId", "name phone email")
    .populate("doctorId", "name doctorProfile.specialization")
    .populate("hospitalId", "name hospitalProfile.hospitalName")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ appointments });
}));

router.get("/certificates", asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({})
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ certificates });
}));

router.get("/live-requests", asyncHandler(async (req, res) => {
  const requests = await BloodRequest.find({
    status: { $in: ["searching", "matched", "donor_accepted", "tracking", "arrived", "donated", "consent_pending", "disputed"] }
  })
    .populate("acceptedDonor", "name bloodGroup phone")
    .sort({ urgency: 1, createdAt: -1 })
    .limit(100);

  res.json({ requests });
}));

router.get("/live-tracking", asyncHandler(async (req, res) => {
  const sessions = await LiveTrackingSession.find({ status: "active" })
    .populate("bloodRequestId", "patientName bloodGroupRequired urgency hospitalName city status")
    .populate("donorId", "name phone bloodGroup")
    .sort({ updatedAt: -1 })
    .limit(100);

  res.json({ sessions });
}));

router.get("/disputed-consents", asyncHandler(async (req, res) => {
  const consents = await DonationConsent.find({ finalStatus: "disputed" })
    .populate("bloodRequestId", "patientName bloodGroupRequired hospitalName status")
    .populate("donorId", "name phone bloodGroup")
    .populate("patientId", "name phone")
    .sort({ updatedAt: -1 });

  res.json({ consents });
}));

module.exports = router;
