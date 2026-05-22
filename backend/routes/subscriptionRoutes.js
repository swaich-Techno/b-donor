const express = require("express");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { adminOnly, protect } = require("../middleware/auth");
const { logAudit } = require("../services/auditService");

const router = express.Router();

const DEFAULT_PLANS = [
  { name: "Patient Free", targetType: "patient", priceMonthly: 0, priceYearly: 0, features: ["Blood request support", "Basic AI assistant", "Doctor listing"] },
  { name: "Health Plus", targetType: "patient", priceMonthly: 49, priceYearly: 499, features: ["More AI summaries", "Family health vault readiness", "Report organization"] },
  { name: "Doctor Free Listing", targetType: "doctor", priceMonthly: 0, priceYearly: 0, features: ["Verified profile application", "Call clinic button"] },
  { name: "Appointment Dashboard", targetType: "doctor", priceMonthly: 999, priceYearly: 9999, features: ["Appointment requests", "Patient summaries with consent", "Prescription workspace"] },
  { name: "Small Hospital", targetType: "hospital", priceMonthly: 999, priceYearly: 9999, features: ["Hospital profile", "Blood request dashboard", "Consent witness tools"] },
  { name: "Emergency Command", targetType: "hospital", priceMonthly: 9999, priceYearly: 99999, features: ["Live requests", "Analytics", "Camp and certificate tools"] },
  { name: "CSR District Campaign", targetType: "corporate", priceMonthly: 0, priceYearly: 0, features: ["Awareness campaign tracking", "Certificate sponsorship", "No access to private donor/patient data"] }
];

async function ensurePlans() {
  const count = await SubscriptionPlan.countDocuments();
  if (count === 0) await SubscriptionPlan.insertMany(DEFAULT_PLANS);
}

router.get("/plans", asyncHandler(async (req, res) => {
  await ensurePlans();
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ targetType: 1, priceMonthly: 1 });
  res.json({
    plans,
    note: "Phase 1 uses manual billing only. No payment is required for blood donation or emergency donor matching."
  });
}));

router.get("/mine", protect, asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ userId: req.user._id })
    .populate("planId")
    .sort({ createdAt: -1 });
  res.json({ subscriptions, userSubscription: req.user.subscription });
}));

router.post("/manual-activate", protect, adminOnly, asyncHandler(async (req, res) => {
  const { userId, planId, amount = 0, notes, endDate } = req.body;
  const [user, plan] = await Promise.all([
    User.findById(userId),
    SubscriptionPlan.findById(planId)
  ]);

  if (!user || !plan) return res.status(404).json({ message: "User or plan not found." });

  const subscription = await Subscription.create({
    userId,
    planId,
    targetType: plan.targetType,
    status: "active",
    startDate: new Date(),
    endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    billingMode: "manual",
    amount,
    notes
  });

  user.subscription = {
    planId: plan._id,
    status: "active",
    expiresAt: subscription.endDate
  };
  await user.save();
  await logAudit(req, { action: "subscription.manual_activate", targetType: "Subscription", targetId: subscription._id, metadata: { userId, planId } });
  res.status(201).json({ subscription });
}));

router.post("/cancel", protect, asyncHandler(async (req, res) => {
  const filter = { _id: req.body.subscriptionId };
  if (!req.user.isAdmin) filter.userId = req.user._id;

  const subscription = await Subscription.findOneAndUpdate(
    filter,
    { status: "cancelled" },
    { new: true }
  );
  if (!subscription) return res.status(404).json({ message: "Subscription not found." });
  await logAudit(req, { action: "subscription.cancel", targetType: "Subscription", targetId: subscription._id });
  res.json({ subscription });
}));

module.exports = router;
