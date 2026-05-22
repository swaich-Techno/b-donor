const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const {
  askGeminiSafely,
  localHealthAssistantReply
} = require("../services/aiHealthService");

const router = express.Router();

router.post("/chat", protect, asyncHandler(async (req, res) => {
  const { message, saveToHistory = true } = req.body;
  if (!message) return res.status(400).json({ message: "Message is required." });

  const local = localHealthAssistantReply(message);
  const geminiReply = await askGeminiSafely(message);

  if (saveToHistory) {
    req.user.medicalHistory.symptomsNotes.push({
      note: `AI conversation note: ${message}`
    });
    await req.user.save();
  }

  res.json({
    assistant: "B Donor AI Health Assistant",
    reply: geminiReply || local.reply,
    redFlags: local.redFlags,
    possibleConcerns: local.possibleConcerns,
    followUpQuestions: local.followUpQuestions,
    disclaimer: "This AI assistant cannot diagnose, prescribe, or replace a doctor. Severe symptoms need urgent medical care."
  });
}));

router.post("/doctor-summary", protect, asyncHandler(async (req, res) => {
  const symptoms = req.body.symptoms || "";
  const history = req.user.medicalHistory || {};
  const summary = [
    `Patient: ${req.user.name}`,
    `Blood group: ${req.user.bloodGroup || "Not provided"}`,
    `Current symptoms: ${symptoms || "Not provided"}`,
    `Allergies: ${(history.allergies || []).join(", ") || "Not provided"}`,
    `Chronic conditions: ${(history.chronicConditions || []).join(", ") || "Not provided"}`,
    `Current medicines: ${(history.currentMedications || []).join(", ") || "Not provided"}`,
    "AI note: This summary is for doctor discussion only and is not a diagnosis."
  ].join("\n");

  res.json({ summary });
}));

module.exports = router;
