const express = require("express");
const BloodRequest = require("../models/BloodRequest");
const DonorAlert = require("../models/DonorAlert");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", protect, asyncHandler(async (req, res) => {
  const alerts = await DonorAlert.find({ donorId: req.user._id })
    .populate("bloodRequestId")
    .sort({ createdAt: -1 });
  res.json({ alerts });
}));

router.post("/:id/accept", protect, asyncHandler(async (req, res) => {
  const alert = await DonorAlert.findById(req.params.id);
  if (!alert) return res.status(404).json({ message: "Alert not found." });
  if (String(alert.donorId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only respond to your own alerts." });
  }

  alert.status = "accepted";
  alert.respondedAt = new Date();
  await alert.save();

  await BloodRequest.updateOne(
    { _id: alert.bloodRequestId, "matchedDonors.donorId": req.user._id },
    {
      $set: {
        acceptedDonor: req.user._id,
        status: "donor_accepted",
        "matchedDonors.$.alertStatus": "accepted",
        "matchedDonors.$.respondedAt": new Date()
      }
    }
  );

  res.json({ alert, message: "You accepted this request. Your contact can now be shown to the requester." });
}));

router.post("/:id/decline", protect, asyncHandler(async (req, res) => {
  const alert = await DonorAlert.findById(req.params.id);
  if (!alert) return res.status(404).json({ message: "Alert not found." });
  if (String(alert.donorId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only respond to your own alerts." });
  }

  alert.status = "declined";
  alert.respondedAt = new Date();
  await alert.save();

  await BloodRequest.updateOne(
    { _id: alert.bloodRequestId, "matchedDonors.donorId": req.user._id },
    {
      $set: {
        "matchedDonors.$.alertStatus": "declined",
        "matchedDonors.$.respondedAt": new Date()
      }
    }
  );

  res.json({ alert, message: "You declined this request." });
}));

module.exports = router;
