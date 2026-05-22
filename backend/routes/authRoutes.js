const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { getJwtSecret } = require("../utils/jwtSecret");
const { protect } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

router.post("/register", asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    gender,
    age,
    bloodGroup,
    accountType = "patient",
    consent = {},
    doctorProfile = {},
    hospitalProfile = {}
  } = req.body;

  if (accountType === "admin") {
    return res.status(400).json({ message: "Admin accounts must be created manually by the system owner." });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email,
    password: hashedPassword,
    phone,
    gender,
    age,
    bloodGroup,
    accountType,
    isPatient: true,
    consent: {
      privacyAccepted: Boolean(consent.privacyAccepted),
      medicalDataAccepted: Boolean(consent.medicalDataAccepted),
      locationAccepted: Boolean(consent.locationAccepted),
      donorConsentAccepted: Boolean(consent.donorConsentAccepted),
      whatsappSmsConsentAccepted: Boolean(consent.whatsappSmsConsentAccepted)
    }
  });

  if (accountType === "donor") {
    user.donorProfile.enabled = true;
    user.donorProfile.approvalStatus = "pending";
    user.donorProfile.isAvailable = false;
  }

  if (accountType === "doctor") {
    user.doctorProfile = {
      ...user.doctorProfile,
      ...doctorProfile,
      enabled: true,
      approvalStatus: "pending"
    };
  }

  if (accountType === "hospital") {
    user.hospitalProfile = {
      ...user.hospitalProfile,
      ...hospitalProfile,
      enabled: true,
      approvalStatus: "pending"
    };
  }

  await user.save();
  res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (user.status === "blocked") {
    return res.status(403).json({ message: "This account is blocked." });
  }

  res.json({ token: signToken(user), user: user.toSafeJSON() });
}));

router.get("/me", protect, asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
}));

module.exports = router;
