const mongoose = require("mongoose");

const { Schema } = mongoose;

const RequestLocationSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: [Number]
  },
  { _id: false }
);

const MatchedDonorSchema = new Schema(
  {
    donorId: { type: Schema.Types.ObjectId, ref: "User" },
    donorBloodGroup: String,
    matchType: { type: String, enum: ["exact", "compatible"], default: "exact" },
    distanceKm: Number,
    alertStatus: {
      type: String,
      enum: ["notified", "accepted", "declined", "no_response"],
      default: "notified"
    },
    notifiedAt: Date,
    respondedAt: Date
  },
  { _id: false }
);

const BloodRequestSchema = new Schema(
  {
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedByType: { type: String, enum: ["patient", "hospital", "admin"], default: "patient" },
    patientName: { type: String, required: true },
    patientAge: Number,
    patientGender: String,
    attendantName: String,
    attendantPhone: String,
    bloodGroupRequired: { type: String, required: true, uppercase: true, trim: true },
    unitsRequired: { type: Number, default: 1 },
    urgency: { type: String, enum: ["normal", "urgent", "critical"], default: "normal" },
    reason: String,
    hospitalName: String,
    hospitalId: { type: Schema.Types.ObjectId, ref: "User" },
    location: { type: RequestLocationSchema, default: () => ({ type: "Point" }) },
    address: String,
    village: String,
    city: String,
    district: String,
    state: String,
    country: { type: String, default: "India" },
    pincode: String,
    locationSource: { type: String, enum: ["gps", "manual"], default: "manual" },
    searchRadiusKm: { type: Number, enum: [2, 5, 10, 20, 50], default: 5 },
    allowCompatibleInEmergency: { type: Boolean, default: true },
    status: {
      type: String,
      enum: [
        "draft",
        "searching",
        "matched",
        "donor_accepted",
        "tracking",
        "arrived",
        "donated",
        "consent_pending",
        "fulfilled",
        "cancelled",
        "expired",
        "disputed"
      ],
      default: "searching"
    },
    exactMatchDonors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    compatibleMatchDonors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    matchedDonors: [MatchedDonorSchema],
    acceptedDonor: { type: Schema.Types.ObjectId, ref: "User" },
    trackingSessionId: { type: Schema.Types.ObjectId, ref: "LiveTrackingSession" },
    donationConsentId: { type: Schema.Types.ObjectId, ref: "DonationConsent" },
    expiresAt: Date
  },
  { timestamps: true }
);

BloodRequestSchema.index({ location: "2dsphere" });
BloodRequestSchema.index({ bloodGroupRequired: 1, status: 1, urgency: 1 });

module.exports = mongoose.model("BloodRequest", BloodRequestSchema);
