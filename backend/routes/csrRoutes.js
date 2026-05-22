const express = require("express");
const CSRPartner = require("../models/CSRPartner");
const asyncHandler = require("../utils/asyncHandler");
const { adminOnly, protect } = require("../middleware/auth");
const { logAudit } = require("../services/auditService");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const filter = req.user?.isAdmin ? {} : { publicVisibility: true, status: "active" };
  const partners = await CSRPartner.find(filter).sort({ createdAt: -1 });
  res.json({
    partners,
    rule: "CSR sponsors cannot influence emergency donor matching and cannot access private patient or donor data."
  });
}));

router.post("/", protect, adminOnly, asyncHandler(async (req, res) => {
  const partner = await CSRPartner.create(req.body);
  await logAudit(req, { action: "csr.create", targetType: "CSRPartner", targetId: partner._id });
  res.status(201).json({ partner });
}));

router.put("/:id", protect, adminOnly, asyncHandler(async (req, res) => {
  const partner = await CSRPartner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!partner) return res.status(404).json({ message: "CSR partner not found." });
  await logAudit(req, { action: "csr.update", targetType: "CSRPartner", targetId: partner._id });
  res.json({ partner });
}));

module.exports = router;
