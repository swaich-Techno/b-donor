const mongoose = require("mongoose");

const { Schema } = mongoose;

const SubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "User" },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    targetType: {
      type: String,
      enum: ["hospital", "doctor", "patient", "ngo", "corporate"],
      required: true
    },
    status: { type: String, enum: ["trial", "active", "expired", "cancelled"], default: "trial" },
    startDate: Date,
    endDate: Date,
    billingMode: { type: String, enum: ["manual", "razorpay", "future"], default: "manual" },
    amount: { type: Number, default: 0 },
    notes: String
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ targetType: 1, status: 1 });

module.exports = mongoose.model("Subscription", SubscriptionSchema);
