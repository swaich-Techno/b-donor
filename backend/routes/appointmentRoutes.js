const express = require("express");
const AppointmentRequest = require("../models/AppointmentRequest");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const { logAudit } = require("../services/auditService");

const router = express.Router();

router.post("/request", protect, asyncHandler(async (req, res) => {
  const { doctorId, hospitalId, requestedFor } = req.body;
  if (!["doctor", "hospital"].includes(requestedFor)) {
    return res.status(400).json({ message: "requestedFor must be doctor or hospital." });
  }
  if (requestedFor === "doctor" && !doctorId) return res.status(400).json({ message: "doctorId is required." });
  if (requestedFor === "hospital" && !hospitalId) return res.status(400).json({ message: "hospitalId is required." });
  if (!req.body.patientConsentToShareMedicalData) {
    return res.status(400).json({ message: "Consent is required before sharing appointment details." });
  }

  const provider = await User.findById(doctorId || hospitalId);
  if (!provider) return res.status(404).json({ message: "Provider not found." });

  const appointment = await AppointmentRequest.create({
    patientId: req.user._id,
    doctorId,
    hospitalId,
    requestedFor,
    specialization: req.body.specialization,
    symptomsSummary: req.body.symptomsSummary,
    aiSummaryId: req.body.aiSummaryId,
    medicalReportIds: req.body.medicalReportIds || [],
    preferredDate: req.body.preferredDate,
    preferredTime: req.body.preferredTime,
    consultationMode: req.body.consultationMode,
    consultationFeeShown: req.body.consultationFeeShown,
    platformFee: 0,
    paymentStatus: "not_required",
    patientConsentToShareMedicalData: true
  });

  req.user.consent.appointmentDataSharingAccepted = true;
  await req.user.save();
  await logAudit(req, { action: "appointment.request", targetType: "AppointmentRequest", targetId: appointment._id });
  res.status(201).json({ appointment, message: "Appointment interest sent. Payment is not required in Phase 1." });
}));

router.get("/mine", protect, asyncHandler(async (req, res) => {
  const appointments = await AppointmentRequest.find({ patientId: req.user._id })
    .populate("doctorId", "name phone doctorProfile")
    .populate("hospitalId", "name phone hospitalProfile")
    .sort({ createdAt: -1 });
  res.json({ appointments });
}));

router.get("/doctor", protect, asyncHandler(async (req, res) => {
  if (!req.user.doctorProfile?.enabled) return res.status(403).json({ message: "Doctor profile required." });
  const appointments = await AppointmentRequest.find({ doctorId: req.user._id })
    .populate("patientId", "name phone email bloodGroup")
    .sort({ createdAt: -1 });
  res.json({ appointments });
}));

router.get("/hospital", protect, asyncHandler(async (req, res) => {
  if (!req.user.hospitalProfile?.enabled) return res.status(403).json({ message: "Hospital profile required." });
  const appointments = await AppointmentRequest.find({ hospitalId: req.user._id })
    .populate("patientId", "name phone email bloodGroup")
    .sort({ createdAt: -1 });
  res.json({ appointments });
}));

async function updateAppointmentStatus(req, res, status) {
  const appointment = await AppointmentRequest.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });

  const ownsProvider = String(appointment.doctorId) === String(req.user._id)
    || String(appointment.hospitalId) === String(req.user._id);
  const ownsPatient = String(appointment.patientId) === String(req.user._id);

  if (!req.user.isAdmin && !ownsProvider && !ownsPatient) {
    return res.status(403).json({ message: "Not allowed to update this appointment." });
  }

  if (["accepted", "rejected", "completed"].includes(status) && !ownsProvider && !req.user.isAdmin) {
    return res.status(403).json({ message: "Only provider or admin can update provider status." });
  }

  appointment.status = status;
  if (status === "rejected") appointment.rejectionReason = req.body.reason;
  if (req.body.doctorNotes) appointment.doctorNotes = req.body.doctorNotes;
  await appointment.save();
  await logAudit(req, { action: `appointment.${status}`, targetType: "AppointmentRequest", targetId: appointment._id });
  return res.json({ appointment });
}

router.post("/:id/accept", protect, asyncHandler((req, res) => updateAppointmentStatus(req, res, "accepted")));
router.post("/:id/reject", protect, asyncHandler((req, res) => updateAppointmentStatus(req, res, "rejected")));
router.post("/:id/cancel", protect, asyncHandler((req, res) => updateAppointmentStatus(req, res, "cancelled")));
router.post("/:id/complete", protect, asyncHandler((req, res) => updateAppointmentStatus(req, res, "completed")));

module.exports = router;
