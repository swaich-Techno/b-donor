const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const { createManualWhatsAppUrl } = require("../services/notificationService");

const router = express.Router();

router.post("/whatsapp-link", protect, asyncHandler(async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ message: "phone and message are required." });
  }

  res.json({
    provider: process.env.WHATSAPP_PROVIDER || "manual",
    manualWhatsAppUrl: createManualWhatsAppUrl(phone, message)
  });
}));

module.exports = router;
