const mongoose = require("mongoose");

const { Schema } = mongoose;

const DonorCoinLedgerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bloodRequestId: { type: Schema.Types.ObjectId, ref: "BloodRequest" },
    donationId: { type: Schema.Types.ObjectId, ref: "BloodDonation" },
    certificateId: { type: Schema.Types.ObjectId, ref: "Certificate" },
    points: { type: Number, required: true },
    type: {
      type: String,
      enum: [
        "verified_donation",
        "profile_verified",
        "recovery_completed",
        "emergency_response",
        "admin_adjustment",
        "community_badge",
        "certificate_bonus",
        "impact_reward"
      ],
      default: "impact_reward"
    },
    description: String,
    hasCashValue: { type: Boolean, default: false },
    transferable: { type: Boolean, default: false },
    withdrawable: { type: Boolean, default: false }
  },
  { timestamps: true }
);

DonorCoinLedgerSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("DonorCoinLedger", DonorCoinLedgerSchema);
