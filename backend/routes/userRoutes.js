const express = require("express");
const Prescription = require("../models/Prescription");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.put("/profile", protect, asyncHandler(async (req, res) => {
  const editable = [
    "name",
    "phone",
    "gender",
    "age",
    "dateOfBirth",
    "bloodGroup",
    "profileImage"
  ];

  editable.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });

  if (req.body.consent) {
    req.user.consent = { ...(req.user.consent.toObject?.() || req.user.consent), ...req.body.consent };
  }

  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}));

router.post("/location", protect, asyncHandler(async (req, res) => {
  const {
    lat,
    lng,
    address,
    village,
    city,
    district,
    state,
    country = "India",
    pincode,
    locationSource = lat && lng ? "gps" : "manual"
  } = req.body;

  const location = {
    type: "Point",
    address,
    village,
    city,
    district,
    state,
    country,
    pincode,
    locationSource
  };

  if (lat !== undefined && lng !== undefined && lat !== "" && lng !== "") {
    location.coordinates = [Number(lng), Number(lat)];
  }

  req.user.location = location;
  req.user.consent.locationAccepted = true;
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}));

router.put("/medical-history", protect, asyncHandler(async (req, res) => {
  const allowed = [
    "allergies",
    "chronicConditions",
    "currentMedications",
    "previousSurgeries",
    "familyHistory"
  ];

  allowed.forEach((field) => {
    if (Array.isArray(req.body[field])) req.user.medicalHistory[field] = req.body[field];
  });

  if (req.body.symptomsNote) {
    req.user.medicalHistory.symptomsNotes.push({ note: req.body.symptomsNote });
  }

  await req.user.save();
  res.json({ medicalHistory: req.user.medicalHistory });
}));

router.get("/prescriptions", protect, asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patientId: req.user._id })
    .populate("doctorId", "name doctorProfile.specialization doctorProfile.medicalRegistrationNumber")
    .sort({ createdAt: -1 });

  res.json({ prescriptions });
}));

router.delete("/medical-reports/:reportId", protect, asyncHandler(async (req, res) => {
  req.user.medicalHistory.uploadedReports = req.user.medicalHistory.uploadedReports
    .filter((id) => String(id) !== String(req.params.reportId));
  await req.user.save();
  res.json({ message: "Report removed from medical history." });
}));

router.get("/privacy-center/summary", protect, asyncHandler(async (req, res) => {
  res.json({
    profile: req.user.toSafeJSON(),
    consent: req.user.consent,
    reportVisibility: req.user.medicalHistory?.uploadedReports || [],
    liveTrackingConsent: req.user.consent?.liveTrackingAccepted,
    appointmentDataSharing: req.user.consent?.appointmentDataSharingAccepted,
    certificateVisibility: req.user.consent?.certificatePublicVerificationAccepted,
    note: "You can withdraw optional consent. Some core safety records may be retained for legal/audit reasons."
  });
}));

router.put("/privacy-center/consent", protect, asyncHandler(async (req, res) => {
  const optionalConsentFields = [
    "locationAccepted",
    "liveTrackingAccepted",
    "whatsappSmsConsentAccepted",
    "certificatePublicVerificationAccepted",
    "appointmentDataSharingAccepted"
  ];

  optionalConsentFields.forEach((field) => {
    if (req.body[field] !== undefined) req.user.consent[field] = Boolean(req.body[field]);
  });

  await req.user.save();
  res.json({ consent: req.user.consent });
}));

router.post("/privacy-center/delete-request", protect, asyncHandler(async (req, res) => {
  req.user.status = "blocked";
  await req.user.save();
  res.json({
    message: "Account deletion request captured. Account is blocked while admin reviews safety/audit retention requirements."
  });
}));

router.get("/:id", protect, asyncHandler(async (req, res) => {
  if (!req.user.isAdmin && String(req.user._id) !== String(req.params.id)) {
    return res.status(403).json({ message: "You can only view your own profile." });
  }

  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user });
}));

module.exports = router;
