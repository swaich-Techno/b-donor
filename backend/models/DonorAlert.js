const mongoose = require("mongoose");

const { Schema } = mongoose;

const DonorAlertSchema = new Schema(
  {
    bloodRequestId: { type: Schema.Types.ObjectId, ref: "BloodRequest", required: true },
    donorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    donorBloodGroup: String,
    requestedBloodGroup: String,
    matchType: { type: String, enum: ["exact", "compatible"], default: "exact" },
    distanceKm: Number,
    radiusKm: Number,
    channels: [{
      type: String,
      enum: ["in_app", "whatsapp_manual", "sms_manual", "whatsapp_api"]
    }],
    messageText: String,
    manualWhatsAppUrl: String,
    status: {
      type: String,
      enum: ["queued", "sent", "failed", "delivered", "accepted", "declined", "expired"],
      default: "queued"
    },
    providerResponse: Schema.Types.Mixed,
    sentAt: Date,
    respondedAt: Date
  },
  { timestamps: true }
);

DonorAlertSchema.index({ donorId: 1, status: 1 });
DonorAlertSchema.index({ bloodRequestId: 1, donorId: 1 });

module.exports = mongoose.model("DonorAlert", DonorAlertSchema);
