const mongoose = require("mongoose");

const { Schema } = mongoose;

const LastLocationSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: [Number],
    accuracy: Number,
    speed: Number,
    heading: Number,
    updatedAt: Date
  },
  { _id: false }
);

const LocationHistorySchema = new Schema(
  {
    coordinates: [Number],
    timestamp: { type: Date, default: Date.now },
    accuracy: Number
  },
  { _id: false }
);

const LiveTrackingSessionSchema = new Schema(
  {
    bloodRequestId: { type: Schema.Types.ObjectId, ref: "BloodRequest", required: true },
    donorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: "User" },
    adminCanView: { type: Boolean, default: true },
    donorConsentGiven: { type: Boolean, default: false },
    startedAt: Date,
    endedAt: Date,
    expiresAt: Date,
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "expired", "stopped_by_donor"],
      default: "active"
    },
    lastLocation: { type: LastLocationSchema, default: () => ({ type: "Point" }) },
    locationHistory: [LocationHistorySchema],
    shareWithPatient: { type: Boolean, default: true },
    shareWithAdmin: { type: Boolean, default: true }
  },
  { timestamps: true }
);

LiveTrackingSessionSchema.index({ lastLocation: "2dsphere" });
LiveTrackingSessionSchema.index({ bloodRequestId: 1, status: 1 });
LiveTrackingSessionSchema.index({ donorId: 1, status: 1 });

module.exports = mongoose.model("LiveTrackingSession", LiveTrackingSessionSchema);
