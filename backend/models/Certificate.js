const mongoose = require("mongoose");

const { Schema } = mongoose;

const CertificateSchema = new Schema(
  {
    certificateId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bloodRequestId: { type: Schema.Types.ObjectId, ref: "BloodRequest" },
    donationConsentId: { type: Schema.Types.ObjectId, ref: "DonationConsent" },
    type: {
      type: String,
      enum: [
        "verified_donor",
        "voluntary_donation",
        "no_money_declaration",
        "recovery_completed",
        "emergency_responder",
        "doctor_verified",
        "hospital_verified",
        "camp_participation"
      ],
      required: true
    },
    title: { type: String, required: true },
    recipientName: String,
    maskedRecipientName: String,
    bloodGroup: String,
    city: String,
    district: String,
    issueDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["valid", "revoked", "disputed"], default: "valid" },
    qrVerificationUrl: String,
    pdfUrl: String,
    publicVisibility: {
      type: String,
      enum: ["private", "public_masked", "public_full"],
      default: "public_masked"
    },
    metadata: Schema.Types.Mixed
  },
  { timestamps: true }
);

CertificateSchema.index({ certificateId: 1 }, { unique: true });
CertificateSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Certificate", CertificateSchema);
