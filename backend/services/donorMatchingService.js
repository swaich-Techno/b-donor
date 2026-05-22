const BloodRequest = require("../models/BloodRequest");
const DonorAlert = require("../models/DonorAlert");
const User = require("../models/User");
const {
  getExactBloodGroup,
  getPriorityMatchGroups,
  normalizeBloodGroup
} = require("../utils/bloodCompatibility");
const {
  buildBloodRequestMessage,
  createManualWhatsAppUrl
} = require("./notificationService");

const SEARCH_RADII_KM = [2, 5, 10, 20, 50];

function hasCoordinates(coordinates) {
  return Array.isArray(coordinates)
    && coordinates.length === 2
    && coordinates.every((value) => Number.isFinite(Number(value)));
}

function getCoordinatesFromRequest(request) {
  if (hasCoordinates(request.location?.coordinates)) {
    return request.location.coordinates.map(Number);
  }
  return null;
}

function calculateDistanceKm(origin, destination) {
  if (!hasCoordinates(origin) || !hasCoordinates(destination)) return null;

  const [lng1, lat1] = origin.map(Number);
  const [lng2, lat2] = destination.map(Number);
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 10) / 10;
}

async function findDonorsNear({ bloodGroups, coordinates, radiusKm, limit = 30 }) {
  if (!hasCoordinates(coordinates)) return [];

  const [lng, lat] = coordinates.map(Number);
  const today = new Date();
  return User.find({
    "donorProfile.enabled": true,
    "donorProfile.approvalStatus": "approved",
    "donorProfile.isAvailable": true,
    $or: [
      { "donorProfile.cooldownUntil": { $exists: false } },
      { "donorProfile.cooldownUntil": null },
      { "donorProfile.cooldownUntil": { $lte: today } }
    ],
    phone: { $exists: true, $ne: "" },
    status: { $ne: "blocked" },
    bloodGroup: { $in: bloodGroups.map(normalizeBloodGroup) },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: Number(radiusKm) * 1000
      }
    }
  })
    .select("-password")
    .limit(limit);
}

async function searchMatchingDonors({
  bloodGroupRequired,
  coordinates,
  radiusKm = 5,
  urgency = "normal",
  allowCompatibleInEmergency = true
}) {
  const recipientGroup = getExactBloodGroup(bloodGroupRequired);
  const priorityGroups = getPriorityMatchGroups(recipientGroup, urgency);
  const exactDonors = await findDonorsNear({
    bloodGroups: priorityGroups.exactGroups,
    coordinates,
    radiusKm
  });

  const exactMatches = exactDonors.map((donor) => ({
    donor,
    donorId: donor._id,
    donorBloodGroup: donor.bloodGroup,
    matchType: "exact",
    distanceKm: calculateDistanceKm(coordinates, donor.location?.coordinates)
  }));

  let compatibleMatches = [];
  const shouldUseCompatible = ["urgent", "critical"].includes(String(urgency).toLowerCase())
    && allowCompatibleInEmergency
    && exactMatches.length === 0;

  if (shouldUseCompatible) {
    const compatibleDonors = await findDonorsNear({
      bloodGroups: priorityGroups.compatibleGroups,
      coordinates,
      radiusKm
    });

    compatibleMatches = compatibleDonors.map((donor) => ({
      donor,
      donorId: donor._id,
      donorBloodGroup: donor.bloodGroup,
      matchType: "compatible",
      distanceKm: calculateDistanceKm(coordinates, donor.location?.coordinates)
    }));
  }

  return {
    exactMatches,
    compatibleMatches,
    allMatches: [...exactMatches, ...compatibleMatches]
      .sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999))
  };
}

async function searchAndAlertDonors(bloodRequestId) {
  const request = await BloodRequest.findById(bloodRequestId);
  if (!request) throw new Error("Blood request not found.");

  const coordinates = getCoordinatesFromRequest(request);
  const result = await searchMatchingDonors({
    bloodGroupRequired: request.bloodGroupRequired,
    coordinates,
    radiusKm: request.searchRadiusKm,
    urgency: request.urgency,
    allowCompatibleInEmergency: request.allowCompatibleInEmergency
  });

  request.exactMatchDonors = result.exactMatches.map((match) => match.donorId);
  request.compatibleMatchDonors = result.compatibleMatches.map((match) => match.donorId);
  request.matchedDonors = result.allMatches.map((match) => ({
    donorId: match.donorId,
    donorBloodGroup: match.donorBloodGroup,
    matchType: match.matchType,
    distanceKm: match.distanceKm,
    alertStatus: "notified",
    notifiedAt: new Date()
  }));
  request.status = result.allMatches.length > 0 ? "matched" : "searching";
  await request.save();

  const alerts = [];
  for (const match of result.allMatches) {
    const messageText = buildBloodRequestMessage({
      request,
      donor: match.donor,
      matchType: match.matchType,
      distanceKm: match.distanceKm
    });

    const alert = await DonorAlert.create({
      bloodRequestId: request._id,
      donorId: match.donorId,
      requesterId: request.requestedBy,
      donorBloodGroup: match.donorBloodGroup,
      requestedBloodGroup: request.bloodGroupRequired,
      matchType: match.matchType,
      distanceKm: match.distanceKm,
      radiusKm: request.searchRadiusKm,
      channels: ["in_app", "whatsapp_manual"],
      messageText,
      manualWhatsAppUrl: createManualWhatsAppUrl(match.donor.phone, messageText),
      status: "sent",
      sentAt: new Date()
    });
    alerts.push(alert);
  }

  return { request, alerts, matches: result };
}

module.exports = {
  SEARCH_RADII_KM,
  calculateDistanceKm,
  findDonorsNear,
  searchAndAlertDonors,
  searchMatchingDonors
};
