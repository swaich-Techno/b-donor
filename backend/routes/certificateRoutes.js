const express = require("express");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { adminOnly, protect } = require("../middleware/auth");
const { createCertificate } = require("../services/certificateService");
const { logAudit } = require("../services/auditService");

const router = express.Router();

router.get("/mine", protect, asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ certificates });
}));

router.get("/verify/:certificateId", asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateId: req.params.certificateId }).lean();
  if (!certificate) return res.status(404).json({ message: "Certificate not found." });

  res.json({
    status: certificate.status,
    certificateType: certificate.type,
    title: certificate.title,
    recipientName: certificate.publicVisibility === "public_full"
      ? certificate.recipientName
      : certificate.maskedRecipientName,
    city: certificate.city,
    district: certificate.district,
    issueDate: certificate.issueDate,
    issuingAuthority: "B Donor",
    verificationTimestamp: new Date(),
    disclaimer: "This certificate verifies B Donor platform records only. B Donor is a connector, not a blood bank."
  });
}));

router.get("/:id", protect, asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id);
  if (!certificate) return res.status(404).json({ message: "Certificate not found." });
  if (!req.user.isAdmin && String(certificate.userId) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not allowed to view this certificate." });
  }
  res.json({ certificate });
}));

router.post("/generate", protect, adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.body.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  const certificate = await createCertificate({
    user,
    type: req.body.type || "verified_donor",
    bloodRequestId: req.body.bloodRequestId,
    donationConsentId: req.body.donationConsentId,
    metadata: req.body.metadata || {}
  });

  if (certificate.type === "verified_donor") {
    user.donorCoin.certificates.addToSet(certificate._id);
    await user.save();
  }

  await logAudit(req, {
    action: "certificate.generate",
    targetType: "Certificate",
    targetId: certificate._id,
    metadata: { type: certificate.type, userId: user._id }
  });

  res.status(201).json({ certificate });
}));

router.post("/:id/revoke", protect, adminOnly, asyncHandler(async (req, res) => {
  const certificate = await Certificate.findByIdAndUpdate(
    req.params.id,
    { status: "revoked", "metadata.revokeReason": req.body.reason },
    { new: true }
  );
  if (!certificate) return res.status(404).json({ message: "Certificate not found." });
  await logAudit(req, { action: "certificate.revoke", targetType: "Certificate", targetId: certificate._id, metadata: { reason: req.body.reason } });
  res.json({ certificate });
}));

router.post("/:id/mark-disputed", protect, adminOnly, asyncHandler(async (req, res) => {
  const certificate = await Certificate.findByIdAndUpdate(
    req.params.id,
    { status: "disputed", "metadata.disputeNote": req.body.note },
    { new: true }
  );
  if (!certificate) return res.status(404).json({ message: "Certificate not found." });
  await logAudit(req, { action: "certificate.dispute", targetType: "Certificate", targetId: certificate._id, metadata: { note: req.body.note } });
  res.json({ certificate });
}));

module.exports = router;
