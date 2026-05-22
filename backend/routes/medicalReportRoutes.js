const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const MedicalReport = require("../models/MedicalReport");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const { summarizeReportLocally } = require("../services/aiHealthService");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename(req, file, callback) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return callback(new Error("Only PDF, JPG, and PNG reports are allowed."));
    }
    callback(null, true);
  }
});

router.post("/upload", protect, upload.single("report"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Report file is required." });

  const report = await MedicalReport.create({
    userId: req.user._id,
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    reportDate: req.body.reportDate,
    reportCategory: req.body.reportCategory,
    extractedText: req.body.extractedText || "",
    visibility: req.body.visibility || "private"
  });

  await User.updateOne(
    { _id: req.user._id },
    { $addToSet: { "medicalHistory.uploadedReports": report._id } }
  );

  res.status(201).json({ report });
}));

router.get("/mine", protect, asyncHandler(async (req, res) => {
  const reports = await MedicalReport.find({ userId: req.user._id }).sort({ uploadedAt: -1 });
  res.json({ reports });
}));

router.get("/:id", protect, asyncHandler(async (req, res) => {
  const report = await MedicalReport.findById(req.params.id);
  if (!report) return res.status(404).json({ message: "Report not found." });
  if (!req.user.isAdmin && String(report.userId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only view your own reports." });
  }
  res.json({ report });
}));

router.post("/:id/analyze", protect, asyncHandler(async (req, res) => {
  const report = await MedicalReport.findById(req.params.id);
  if (!report) return res.status(404).json({ message: "Report not found." });
  if (!req.user.isAdmin && String(report.userId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only analyze your own reports." });
  }

  const summary = summarizeReportLocally({
    fileName: report.fileName,
    reportCategory: report.reportCategory,
    notes: req.body.notes || report.extractedText || ""
  });

  report.aiSummary = summary.aiSummary;
  report.detectedPossibleIssues = summary.detectedPossibleIssues;
  report.redFlags = summary.redFlags;
  await report.save();

  res.json({ report });
}));

module.exports = router;
