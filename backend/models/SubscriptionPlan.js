const mongoose = require("mongoose");

const { Schema } = mongoose;

const SubscriptionPlanSchema = new Schema(
  {
    name: { type: String, required: true },
    targetType: {
      type: String,
      enum: ["hospital", "doctor", "patient", "ngo", "corporate"],
      required: true
    },
    priceMonthly: { type: Number, default: 0 },
    priceYearly: { type: Number, default: 0 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

SubscriptionPlanSchema.index({ targetType: 1, isActive: 1 });

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
