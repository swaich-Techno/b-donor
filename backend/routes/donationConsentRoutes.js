const express = require("express");
const BloodDonation = require("../models/BloodDonation");
const BloodRequest = require("../models/BloodRequest");
const DonationConsent = require("../models/DonationConsent");
const LiveTrackingSession = require("../models/LiveTrackingSession");
const asyncHandler = require("../utils/asyncHandler");
const { adminOnly, protect } = require("../middleware/auth");
const { finalizeDonation } = require("../services/donationCompletionService");

const router = express.Router();

const DONOR_DECLARATION = "I confirm that I donated voluntarily and did not ask for or receive money, gift, crypto, coupon, or any cash-like benefit for donating blood.";
const PATIENT_DECLARATION = "I confirm that blood support was received and the donor did not ask for money, gift, crypto, coupon, or any payment.";

async function getRequestForConsent(bloodRequestId) {
  const request = await BloodRequest.findById(bloodRequestId);
  if (!request) throw Object.assign(new Error("Blood request not found."), { status: 404 });
  if (!request.acceptedDonor) throw Object.assign(new Error("No accepted donor for this request yet."), { status: 400 });
  return request;
}

async function upsertConsent(request) {
  return DonationConsent.findOneAndUpdate(
    { bloodRequestId: request._id },
    {
      $setOnInsert: {
        bloodRequestId: request._id,
        donorId: request.acceptedDonor,
        patientId: request.requestedBy,
        hospitalId: request.hospitalId,
        donorDeclaration: { text: DONOR_DECLARATION },
        patientDeclaration: { text: PATIENT_DECLARATION }
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function canViewConsent(user, consent) {
  return user.isAdmin
    || String(consent.donorId?._id || consent.donorId) === String(user._id)
    || String(consent.patientId?._id || consent.patientId) === String(user._id)
    || String(consent.hospitalId?._id || consent.hospitalId) === String(user._id);
}

router.post("/:bloodRequestId/donor-confirm", protect, asyncHandler(async (req, res) => {
  const request = await getRequestForConsent(req.params.bloodRequestId);
  if (String(request.acceptedDonor) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the accepted donor can confirm donation." });
  }

  const consent = await upsertConsent(request);
  consent.donorDeclaration = {
    confirmed: true,
    text: DONOR_DECLARATION,
    signedAt: new Date(),
    otpVerified: Boolean(req.body.otpVerified),
    ipAddress: req.ip
  };
  consent.finalStatus = consent.finalStatus === "disputed" ? "disputed" : "pending";
  await consent.save();

  let donation = consent.donationId ? await BloodDonation.findById(consent.donationId) : null;
  if (!donation) {
    donation = await BloodDonation.create({
      donorId: consent.donorId,
      bloodRequestId: request._id,
      requesterId: request.requestedBy,
      hospitalName: request.hospitalName,
      bloodGroup: request.bloodGroupRequired,
      donationDate: new Date(),
      status: "planned"
    });
    consent.donationId = donation._id;
    await consent.save();
  }

  request.status = "consent_pending";
  request.donationConsentId = consent._id;
  await request.save();
  await LiveTrackingSession.updateMany({ bloodRequestId: request._id, status: "active" }, { $set: { status: "completed", endedAt: new Date() } });

  res.json({ consent, message: "Donor declaration saved. Patient confirmation is now required." });
}));

router.post("/:bloodRequestId/patient-confirm", protect, asyncHandler(async (req, res) => {
  const request = await getRequestForConsent(req.params.bloodRequestId);
  if (String(request.requestedBy) !== String(req.user._id) && !req.user.isAdmin) {
    return res.status(403).json({ message: "Only the requester or admin can confirm blood received." });
  }

  const consent = await upsertConsent(request);
  const disputed = Boolean(req.body.disputed);
  consent.patientDeclaration = {
    confirmed: !disputed,
    text: PATIENT_DECLARATION,
    signedAt: new Date(),
    otpVerified: Boolean(req.body.otpVerified),
    ipAddress: req.ip
  };
  consent.finalStatus = disputed ? "disputed" : "pending";
  if (disputed) {
    request.status = "disputed";
  } else if (consent.donorDeclaration?.confirmed) {
    request.status = "consent_pending";
  }
  await consent.save();
  request.donationConsentId = consent._id;
  await request.save();

  res.json({ consent, message: disputed ? "Dispute opened for admin review." : "Patient declaration saved." });
}));

router.post("/:bloodRequestId/hospital-confirm", protect, asyncHandler(async (req, res) => {
  const request = await getRequestForConsent(req.params.bloodRequestId);
  const isHospital = req.user.hospitalProfile?.enabled && req.user.hospitalProfile.approvalStatus === "approved";
  if (!req.user.isAdmin && !isHospital) {
    return res.status(403).json({ message: "Approved hospital or admin access required." });
  }

  const consent = await upsertConsent(request);
  consent.hospitalWitness = {
    confirmed: true,
    staffName: req.body.staffName,
    designation: req.body.designation,
    signedAt: new Date(),
    otpVerified: Boolean(req.body.otpVerified)
  };
  await consent.save();
  res.json({ consent, message: "Hospital witness confirmation saved." });
}));

router.post("/:bloodRequestId/admin-verify", protect, adminOnly, asyncHandler(async (req, res) => {
  const request = await getRequestForConsent(req.params.bloodRequestId);
  const consent = await upsertConsent(request);

  if (req.body.status === "rejected" || consent.finalStatus === "disputed") {
    consent.adminVerification = {
      status: req.body.status || "rejected",
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      notes: req.body.notes
    };
    consent.finalStatus = consent.finalStatus === "disputed" ? "disputed" : "rejected";
    await consent.save();
    return res.json({ consent, message: "Consent marked for review." });
  }

  if (!consent.donorDeclaration?.confirmed || !consent.patientDeclaration?.confirmed) {
    return res.status(400).json({ message: "Donor and patient declarations are required before verification." });
  }

  const result = await finalizeDonation(consent, req.user._id);
  res.json({ ...result, message: "Donation verified, cooldown started, and Donor Coin impact points awarded." });
}));

router.get("/mine", protect, asyncHandler(async (req, res) => {
  const filter = req.user.isAdmin
    ? {}
    : { $or: [{ donorId: req.user._id }, { patientId: req.user._id }, { hospitalId: req.user._id }] };
  const consents = await DonationConsent.find(filter)
    .populate("bloodRequestId", "patientName bloodGroupRequired hospitalName status")
    .populate("donorId", "name bloodGroup")
    .populate("patientId", "name")
    .sort({ createdAt: -1 });
  res.json({ consents });
}));

router.get("/:id", protect, asyncHandler(async (req, res) => {
  const consent = await DonationConsent.findById(req.params.id)
    .populate("bloodRequestId")
    .populate("donorId", "name bloodGroup")
    .populate("patientId", "name")
    .populate("hospitalId", "name hospitalProfile.hospitalName");
  if (!consent) return res.status(404).json({ message: "Consent not found." });
  if (!canViewConsent(req.user, consent)) return res.status(403).json({ message: "Not allowed to view this consent." });
  res.json({ consent });
}));

module.exports = router;
