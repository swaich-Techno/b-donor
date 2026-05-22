const express = require("express");
const BloodRequest = require("../models/BloodRequest");
const LiveTrackingSession = require("../models/LiveTrackingSession");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const { calculateDistanceKm } = require("../services/donorMatchingService");

const router = express.Router();

function canViewTracking(user, request) {
  if (user.isAdmin) return true;
  if (String(request.requestedBy) === String(user._id)) return true;
  if (String(request.acceptedDonor?._id || request.acceptedDonor) === String(user._id)) return true;
  if (request.hospitalId && String(request.hospitalId) === String(user._id)) return true;
  return false;
}

function locationFromBody(body) {
  const lng = Number(body.lng);
  const lat = Number(body.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return {
    type: "Point",
    coordinates: [lng, lat],
    accuracy: body.accuracy,
    speed: body.speed,
    heading: body.heading,
    updatedAt: new Date()
  };
}

router.post("/:bloodRequestId/start", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.bloodRequestId);
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (String(request.acceptedDonor) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the accepted donor can start live tracking." });
  }
  if (!req.body.donorConsentGiven) {
    return res.status(400).json({ message: "Donor live location consent is required." });
  }

  const location = locationFromBody(req.body) || { type: "Point" };
  const update = {
    $set: {
      bloodRequestId: request._id,
      donorId: req.user._id,
      patientId: request.requestedBy,
      hospitalId: request.hospitalId,
      adminCanView: true,
      donorConsentGiven: true,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      status: "active",
      lastLocation: location,
      shareWithPatient: true,
      shareWithAdmin: true
    }
  };

  if (location.coordinates?.length === 2) {
    update.$push = {
      locationHistory: {
        coordinates: location.coordinates,
        timestamp: new Date(),
        accuracy: location.accuracy
      }
    };
  }

  const session = await LiveTrackingSession.findOneAndUpdate(
    { bloodRequestId: request._id, donorId: req.user._id, status: "active" },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  request.status = "tracking";
  request.trackingSessionId = session._id;
  await request.save();

  req.user.consent.liveTrackingAccepted = true;
  await req.user.save();

  res.status(201).json({ session });
}));

router.post("/:bloodRequestId/location", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.bloodRequestId);
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (String(request.acceptedDonor) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the accepted donor can update live location." });
  }

  const location = locationFromBody(req.body);
  if (!location) return res.status(400).json({ message: "Valid lng and lat are required." });

  const session = await LiveTrackingSession.findOneAndUpdate(
    { bloodRequestId: request._id, donorId: req.user._id, status: "active" },
    {
      $set: { lastLocation: location },
      $push: {
        locationHistory: {
          coordinates: location.coordinates,
          timestamp: new Date(),
          accuracy: location.accuracy
        }
      }
    },
    { new: true }
  );

  if (!session) return res.status(404).json({ message: "Active tracking session not found." });
  res.json({ session });
}));

router.get("/:bloodRequestId/live", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.bloodRequestId)
    .populate("acceptedDonor", "name phone bloodGroup location.city location.district");
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (!canViewTracking(req.user, request)) {
    return res.status(403).json({ message: "Tracking is visible only to donor, requester, hospital, or admin." });
  }

  const session = await LiveTrackingSession.findOne({ bloodRequestId: request._id }).sort({ createdAt: -1 });
  if (!session) return res.json({ request, session: null, etaMinutes: null, distanceKm: null });

  const distanceKm = calculateDistanceKm(
    session.lastLocation?.coordinates,
    request.location?.coordinates
  );
  const etaMinutes = distanceKm ? Math.max(3, Math.round((distanceKm / 24) * 60)) : null;

  res.json({ request, session, etaMinutes, distanceKm });
}));

router.post("/:bloodRequestId/stop", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.bloodRequestId);
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (!req.user.isAdmin && String(request.acceptedDonor) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the donor or admin can stop tracking." });
  }

  const session = await LiveTrackingSession.findOneAndUpdate(
    { bloodRequestId: request._id, status: "active" },
    { $set: { status: "stopped_by_donor", endedAt: new Date() } },
    { new: true }
  );
  res.json({ session });
}));

router.post("/:bloodRequestId/complete", protect, asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.bloodRequestId);
  if (!request) return res.status(404).json({ message: "Blood request not found." });
  if (!req.user.isAdmin && String(request.acceptedDonor) !== String(req.user._id) && String(request.requestedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only donor, requester, or admin can complete tracking." });
  }

  const session = await LiveTrackingSession.findOneAndUpdate(
    { bloodRequestId: request._id, status: "active" },
    { $set: { status: "completed", endedAt: new Date() } },
    { new: true }
  );
  request.status = request.status === "tracking" ? "arrived" : request.status;
  await request.save();
  res.json({ session, request });
}));

module.exports = router;
