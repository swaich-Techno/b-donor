const express = require("express");
const BloodRequest = require("../models/BloodRequest");
const DonorAlert = require("../models/DonorAlert");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { adminOnly, protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, adminOnly, asyncHandler(async (req, res) => {
  const [
    totalPatients,
    totalDonors,
    activeRequests,
    criticalRequests,
    alerts,
    donorsByBloodGroup,
    requestsByDistrict
  ] = await Promise.all([
    User.countDocuments({ isPatient: true }),
    User.countDocuments({ "donorProfile.enabled": true }),
    BloodRequest.countDocuments({ status: { $in: ["searching", "matched", "accepted"] } }),
    BloodRequest.countDocuments({ urgency: "critical", status: { $in: ["searching", "matched", "accepted"] } }),
    DonorAlert.find({}).select("status"),
    User.aggregate([
      { $match: { "donorProfile.enabled": true } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    BloodRequest.aggregate([
      { $group: { _id: { city: "$city", district: "$district" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  const acceptedAlerts = alerts.filter((alert) => alert.status === "accepted").length;
  const alertAcceptanceRate = alerts.length ? Math.round((acceptedAlerts / alerts.length) * 100) : 0;

  res.json({
    totalPatients,
    totalDonors,
    activeRequests,
    criticalRequests,
    donorsByBloodGroup,
    requestsByDistrict,
    alertAcceptanceRate,
    complaints: 0
  });
}));

module.exports = router;
