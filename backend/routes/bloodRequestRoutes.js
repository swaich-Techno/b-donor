const express = require("express");
const BloodRequest = require("../models/BloodRequest");
const DonationConsent = require("../models/DonationConsent");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const { SEARCH_RADII_KM, searchAndAlertDonors } = require("../services/donorMatchingService");

const router = express.Router();

function requestLocationFromBody(body) {
  const location = { type: "Point" };
  const coordinates = body.location?.coordinates;

  if (Array.isArray(coordinates) && coordinates.length === 2) {
    location.coordinates = coordinates.map(Number);
  } else if (body.lat !== undefined && body.lng !== undefined && body.lat !== "" && body.lng !== "") {
    location.coordinates = [Number(body.lng), Number(body.lat)];
  }

  return location;
}

function getRequestedByType(user, requestedByType) {
  if (user.isAdmin && requestedByType === "admin") return "admin";
  if (user.hospitalProfile?.enabled && user.hospitalProfile.approvalStatus === "approved") return "hospital";
  return "patient";
}

async function populateRequest(query) {
  return query
    .populate("acceptedDonor", "name phone bloodGroup donorProfile.totalDonations location.city location.district")
    .populate("trackingSessionId")
    .populate("donationConsentId")
    .populate("requestedBy", "name phone email")
    .lean();
}

function canViewRequest(user, request) {
  if (user.isAdmin) return true;
  if (String(request.requestedBy?._id || request.requestedBy) === String(user._id)) return true;
  return request.matchedDonors?.some((match) => String(match.donorId) === String(user._id));
}

router.post("/", protect, asyncHandler(async (req, res) => {
  const {
    patientName,
    patientAge,
    patientGender,
    attendantName,
    attendantPhone,
    bloodGroupRequired,
    unitsRequired,
    urgency,
    reason,
    hospitalName,
    hospitalId,
    address,
    village,
    city,
    district,
    state,
    country = "India",
    pincode,
    locationSource,
    searchRadiusKm = 5,
    allowCompatibleInEmergency = true
  } = req.body;

  if (!patientName || !bloodGroupRequired) {
    return res.status(400).json({ message: "Patient name and required blood group are required." });
  }

  const request = await BloodRequest.create({
    requestedBy: req.user._id,
    requestedByType: getRequestedByType(req.user, req.body.requestedByType),
    patientName,
    patientAge,
    patientGender,
    attendantName,
    attendantPhone,
    bloodGroupRequired,
    unitsRequired,
    urgency,
    reason,
    hospitalName,
    hospitalId,
    location: requestLocationFromBody(req.body),
    address,
    village,
    city,
    district,
    state,
    country,
    pincode,
    locationSource: locationSource || (req.body.lat && req.body.lng ? "gps" : "manual"),
    searchRadiusKm: SEARCH_RADII_KM.includes(Number(searchRadiusKm)) ? Number(searchRadiusKm) : 5,
    allowCompatibleInEmergency: Boolean(allowCompatibleInEmergency),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
  });

  let alertResult = { alerts: [] };
  if (request.location?.coordinates?.length === 2) {
    alertResult = await searchAndAlertDonors(request._id);
  }

  const updatedRequest = await populateRequest(BloodRequest.findById(request._id));
  res.status(201).json({
    request: updatedRequest,
    alertsCreated: alertResult.alerts.length,
    message: request.location?.coordinates?.length === 2
      ? "Blood request created and donor search started."
      : "Blood request created. Add GPS coordinates later to run nearby donor matching."
  });
}));

router.get("/mine", protect, asyncHandler(async (req, res) => {
  const filter = req.user.isAdmin ? {} : { requestedBy: req.user._id };
  const requests = await BloodRequest.find(filter)
    .populate("acceptedDonor", "name phone bloodGroup location.city location.district")
    .sort({ createdAt: -1 });
  res.json({ requests });
}));

router.get("/:id", protect, asyncHandler(async (req, res) => {
  const request = await populateRequest(BloodRequest.findById(req.params.id));
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (!canViewRequest(req.user, request)) return res.status(403).json({ message: "Not allowed to view this request." });

  if (!request.acceptedDonor && !req.user.isAdmin) {
    delete request.acceptedDonor;
  }

  res.json({ request });
}));

router.post("/:id/search-donors", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (!req.user.isAdmin && String(request.requestedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the requester or admin can search donors." });
  }

  const result = await searchAndAlertDonors(request._id);
  res.json({ request: result.request, alertsCreated: result.alerts.length, matches: result.matches.allMatches.length });
}));

router.post("/:id/expand-radius", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (!req.user.isAdmin && String(request.requestedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the requester or admin can expand search radius." });
  }

  const currentIndex = SEARCH_RADII_KM.indexOf(request.searchRadiusKm);
  request.searchRadiusKm = SEARCH_RADII_KM[Math.min(currentIndex + 1, SEARCH_RADII_KM.length - 1)] || 50;
  await request.save();

  const result = await searchAndAlertDonors(request._id);
  res.json({ request: result.request, alertsCreated: result.alerts.length });
}));

router.post("/:id/cancel", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (!req.user.isAdmin && String(request.requestedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the requester or admin can cancel this request." });
  }

  request.status = "cancelled";
  await request.save();
  res.json({ request });
}));

router.post("/:id/mark-donated", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (!request.acceptedDonor) {
    return res.status(400).json({ message: "A donor must accept before donation can be marked." });
  }
  if (!req.user.isAdmin && String(request.acceptedDonor) !== String(req.user._id) && String(request.requestedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only accepted donor, requester, or admin can mark donated." });
  }

  const consent = await DonationConsent.findOneAndUpdate(
    { bloodRequestId: request._id },
    {
      $setOnInsert: {
        bloodRequestId: request._id,
        donorId: request.acceptedDonor,
        patientId: request.requestedBy,
        hospitalId: request.hospitalId
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  request.status = "donated";
  request.donationConsentId = consent._id;
  await request.save();
  res.json({ request, consent, message: "Donation marked. No-money consent confirmation is required next." });
}));

router.post("/:id/fulfill", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (!req.user.isAdmin && String(request.requestedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the requester or admin can mark fulfilled." });
  }

  request.status = "fulfilled";
  await request.save();
  res.json({ request });
}));

module.exports = router;
