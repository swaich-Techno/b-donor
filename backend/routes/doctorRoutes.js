const express = require("express");
const Prescription = require("../models/Prescription");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { approvedDoctorOnly, protect } = require("../middleware/auth");

const router = express.Router();

router.post("/apply", protect, asyncHandler(async (req, res) => {
  req.user.doctorProfile = {
    ...(req.user.doctorProfile.toObject?.() || req.user.doctorProfile),
    ...req.body,
    enabled: true,
    approvalStatus: "pending",
    rejectionReason: ""
  };
  req.user.accountType = req.user.accountType === "patient" ? "doctor" : req.user.accountType;
  await req.user.save();
  res.json({ user: req.user.toSafeJSON(), message: "Doctor profile submitted for admin approval." });
}));

router.put("/profile", protect, asyncHandler(async (req, res) => {
  if (!req.user.doctorProfile?.enabled) {
    return res.status(400).json({ message: "Apply as doctor first." });
  }

  req.user.doctorProfile = {
    ...(req.user.doctorProfile.toObject?.() || req.user.doctorProfile),
    ...req.body,
    enabled: true
  };
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}));

router.get("/nearby", protect, asyncHandler(async (req, res) => {
  const { lat, lng, radiusKm = 20, specialization } = req.query;
  const filter = {
    "doctorProfile.enabled": true,
    "doctorProfile.approvalStatus": "approved",
    status: { $ne: "blocked" }
  };

  if (specialization) {
    filter["doctorProfile.specialization"] = new RegExp(String(specialization), "i");
  }

  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusKm) * 1000
      }
    };
  }

  const doctors = await User.find(filter)
    .select("name phone location.city location.district doctorProfile")
    .limit(50);
  res.json({ doctors });
}));

router.get("/search", protect, asyncHandler(async (req, res) => {
  const {
    specialization,
    city,
    district,
    consultationMode,
    language,
    maxFee
  } = req.query;

  const filter = {
    "doctorProfile.enabled": true,
    "doctorProfile.approvalStatus": "approved",
    status: { $ne: "blocked" }
  };

  if (specialization) filter["doctorProfile.specialization"] = new RegExp(String(specialization), "i");
  if (city) filter["location.city"] = new RegExp(String(city), "i");
  if (district) filter["location.district"] = new RegExp(String(district), "i");
  if (consultationMode) filter["doctorProfile.consultationModes"] = consultationMode;
  if (language) filter["doctorProfile.languagesSpoken"] = new RegExp(String(language), "i");
  if (maxFee) filter["doctorProfile.consultationFee"] = { $lte: Number(maxFee) };

  const doctors = await User.find(filter)
    .select("name phone location doctorProfile")
    .sort({ "doctorProfile.verifiedBadge": -1, "doctorProfile.experience": -1 })
    .limit(100);

  res.json({ doctors });
}));

router.post("/prescriptions", protect, approvedDoctorOnly, asyncHandler(async (req, res) => {
  const { patientId, symptomsSummary, diagnosisNotes, medicines, testsRecommended, followUpAdvice } = req.body;
  if (!patientId || !Array.isArray(medicines)) {
    return res.status(400).json({ message: "patientId and medicines are required." });
  }

  const patient = await User.findById(patientId);
  if (!patient) return res.status(404).json({ message: "Patient not found." });

  const prescription = await Prescription.create({
    doctorId: req.user._id,
    patientId,
    symptomsSummary,
    diagnosisNotes,
    medicines,
    testsRecommended,
    followUpAdvice
  });

  res.status(201).json({ prescription });
}));

router.get("/prescriptions/mine", protect, approvedDoctorOnly, asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ doctorId: req.user._id })
    .populate("patientId", "name phone email")
    .sort({ createdAt: -1 });
  res.json({ prescriptions });
}));

router.get("/:id", protect, asyncHandler(async (req, res) => {
  const doctor = await User.findOne({
    _id: req.params.id,
    "doctorProfile.enabled": true,
    "doctorProfile.approvalStatus": "approved",
    status: { $ne: "blocked" }
  }).select("name phone location doctorProfile");
  if (!doctor) return res.status(404).json({ message: "Doctor not found." });
  res.json({ doctor });
}));

module.exports = router;
