const express = require("express");
const Prescription = require("../models/Prescription");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { approvedDoctorOnly, protect } = require("../middleware/auth");
const { logAudit } = require("../services/auditService");

const router = express.Router();

router.post("/", protect, approvedDoctorOnly, asyncHandler(async (req, res) => {
  const patient = await User.findById(req.body.patientId);
  if (!patient) return res.status(404).json({ message: "Patient not found." });

  const prescription = await Prescription.create({
    patientId: req.body.patientId,
    doctorId: req.user._id,
    appointmentId: req.body.appointmentId,
    symptomsSummary: req.body.symptomsSummary,
    diagnosisByDoctor: req.body.diagnosisByDoctor,
    medicines: req.body.medicines || [],
    testsRecommended: req.body.testsRecommended || [],
    advice: req.body.advice,
    followUpDate: req.body.followUpDate,
    doctorRegistrationNumber: req.user.doctorProfile?.medicalRegistrationNumber
  });

  await logAudit(req, { action: "prescription.create", targetType: "Prescription", targetId: prescription._id, metadata: { patientId: patient._id } });
  res.status(201).json({ prescription });
}));

router.get("/mine", protect, asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patientId: req.user._id })
    .populate("doctorId", "name doctorProfile.specialization doctorProfile.medicalRegistrationNumber")
    .sort({ createdAt: -1 });
  res.json({ prescriptions });
}));

router.get("/patient/:patientId", protect, approvedDoctorOnly, asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patientId: req.params.patientId })
    .populate("doctorId", "name doctorProfile.specialization doctorProfile.medicalRegistrationNumber")
    .sort({ createdAt: -1 });
  res.json({ prescriptions });
}));

router.get("/:id", protect, asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate("doctorId", "name doctorProfile")
    .populate("patientId", "name phone email bloodGroup");
  if (!prescription) return res.status(404).json({ message: "Prescription not found." });
  const allowed = req.user.isAdmin
    || String(prescription.patientId._id) === String(req.user._id)
    || String(prescription.doctorId._id) === String(req.user._id);
  if (!allowed) return res.status(403).json({ message: "Not allowed to view this prescription." });
  res.json({ prescription });
}));

module.exports = router;
