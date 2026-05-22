const Certificate = require("../models/Certificate");

function maskName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "B Donor user";
  return parts.map((part) => `${part[0]}${"*".repeat(Math.max(1, part.length - 1))}`).join(" ");
}

function certificateTitle(type) {
  const titles = {
    verified_donor: "Verified Donor Certificate",
    voluntary_donation: "Voluntary Donation Certificate",
    no_money_declaration: "No-Money Declaration Certificate",
    recovery_completed: "Recovery Completed Badge",
    emergency_responder: "Emergency Responder Badge",
    doctor_verified: "Doctor Verified Badge",
    hospital_verified: "Hospital Verified Partner Badge",
    camp_participation: "Blood Camp Participation Certificate"
  };
  return titles[type] || "B Donor Certificate";
}

function makeCertificateId(type) {
  const prefix = type.split("_").map((part) => part[0]).join("").toUpperCase().slice(0, 4);
  return `BD-${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function createCertificate({
  user,
  type,
  bloodRequestId,
  donationConsentId,
  metadata = {},
  baseUrl
}) {
  const certificateId = makeCertificateId(type);
  const qrVerificationUrl = `${baseUrl || process.env.FRONTEND_URL || "http://localhost:3000"}/verify/certificate/${certificateId}`;

  const certificate = await Certificate.create({
    certificateId,
    userId: user._id,
    bloodRequestId,
    donationConsentId,
    type,
    title: certificateTitle(type),
    recipientName: user.name,
    maskedRecipientName: maskName(user.name),
    bloodGroup: user.bloodGroup,
    city: user.location?.city,
    district: user.location?.district,
    qrVerificationUrl,
    publicVisibility: user.consent?.certificatePublicVerificationAccepted ? "public_full" : "public_masked",
    metadata
  });

  return certificate;
}

module.exports = {
  createCertificate,
  maskName
};
