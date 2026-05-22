const mongoose = require("mongoose");

const { Schema } = mongoose;

const BloodDonationSchema = new Schema(
  {
    donorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bloodRequestId: { type: Schema.Types.ObjectId, ref: "BloodRequest" },
    requesterId: { type: Schema.Types.ObjectId, ref: "User" },
    hospitalName: String,
    bloodGroup: String,
    unitsDonated: { type: Number, default: 1 },
    donationDate: Date,
    notes: String,
    status: {
      type: String,
      enum: ["planned", "completed", "cancelled"],
      default: "planned"
    }
  },
  { timestamps: true }
);

BloodDonationSchema.index({ donorId: 1, donationDate: -1 });

module.exports = mongoose.model("BloodDonation", BloodDonationSchema);
