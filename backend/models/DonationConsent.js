const mongoose = require("mongoose");

const { Schema } = mongoose;

const DeclarationSchema = new Schema(
  {
    confirmed: { type: Boolean, default: false },
    text: String,
    signedAt: Date,
    otpVerified: { type: Boolean, default: false },
    ipAddress: String
  },
  { _id: false }
);

const DonationConsentSchema = new Schema(
  {
    bloodRequestId: { type: Schema.Types.ObjectId, ref: "BloodRequest", required: true },
    donorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: "User" },
    donationId: { type: Schema.Types.ObjectId, ref: "BloodDonation" },
    donorDeclaration: {
      type: DeclarationSchema,
      default: () => ({
        text: "I confirm that I donated voluntarily and did not ask for or receive money, gift, crypto, coupon, or any cash-like benefit for donating blood."
      })
    },
    patientDeclaration: {
      type: DeclarationSchema,
      default: () => ({
        text: "I confirm that blood support was received and the donor did not ask for money, gift, crypto, coupon, or any payment."
      })
    },
    hospitalWitness: {
      confirmed: { type: Boolean, default: false },
      staffName: String,
      designation: String,
      signedAt: Date,
      otpVerified: { type: Boolean, default: false }
    },
    adminVerification: {
      status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
      verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
      verifiedAt: Date,
      notes: String
    },
    finalStatus: {
      type: String,
      enum: ["pending", "completed", "disputed", "rejected"],
      default: "pending"
    },
    generatedPdfUrl: String
  },
  { timestamps: true }
);

DonationConsentSchema.index({ bloodRequestId: 1 }, { unique: true });
DonationConsentSchema.index({ donorId: 1, finalStatus: 1 });
DonationConsentSchema.index({ patientId: 1, finalStatus: 1 });

module.exports = mongoose.model("DonationConsent", DonationConsentSchema);
