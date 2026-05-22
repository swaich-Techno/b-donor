const BloodDonation = require("../models/BloodDonation");
const BloodRequest = require("../models/BloodRequest");
const DonationConsent = require("../models/DonationConsent");
const DonorCoinLedger = require("../models/DonorCoinLedger");
const LiveTrackingSession = require("../models/LiveTrackingSession");
const User = require("../models/User");
const { createCertificate } = require("./certificateService");

const DONOR_COIN_REWARD = 100;
const COOLDOWN_DAYS = 90;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function donorLevel(points) {
  if (points >= 1000) return "Lifesaver Circle";
  if (points >= 500) return "Trusted Donor";
  if (points >= 100) return "First Impact";
  return "New Helper";
}

async function finalizeDonation(consent, verifierId) {
  const request = await BloodRequest.findById(consent.bloodRequestId);
  if (!request) throw new Error("Blood request not found.");

  let donation = consent.donationId
    ? await BloodDonation.findById(consent.donationId)
    : null;

  if (!donation) {
    donation = await BloodDonation.create({
      donorId: consent.donorId,
      bloodRequestId: consent.bloodRequestId,
      requesterId: consent.patientId,
      hospitalName: request.hospitalName,
      bloodGroup: request.bloodGroupRequired,
      donationDate: new Date(),
      status: "completed"
    });
  } else {
    donation.status = "completed";
    donation.donationDate = donation.donationDate || new Date();
    await donation.save();
  }

  const now = new Date();
  const cooldownUntil = addDays(now, COOLDOWN_DAYS);

  const donor = await User.findById(consent.donorId);
  let donationCertificate = null;
  if (donor) {
    donor.donorCoin = donor.donorCoin || {};
    donor.donorCoin.badges = donor.donorCoin.badges || [];
    donor.donorProfile.isAvailable = false;
    donor.donorProfile.lastDonationDate = now;
    donor.donorProfile.cooldownUntil = cooldownUntil;
    donor.donorProfile.nextEligibleDonationDate = cooldownUntil;
    donor.donorProfile.totalDonations = (donor.donorProfile.totalDonations || 0) + 1;
    donor.donorProfile.donationCount = (donor.donorProfile.donationCount || 0) + 1;
    donor.donorProfile.recoveryTipsSent = true;
    donor.donorProfile.temporaryUnavailableReason = "Recovery cooldown after verified donation";
    donor.donorCoin.impactPoints = (donor.donorCoin.impactPoints || 0) + DONOR_COIN_REWARD;
    donor.donorCoin.level = donorLevel(donor.donorCoin.impactPoints);
    if (!donor.donorCoin.badges.includes("Verified Voluntary Donor")) {
      donor.donorCoin.badges.push("Verified Voluntary Donor");
    }

    donationCertificate = await createCertificate({
      user: donor,
      type: "voluntary_donation",
      bloodRequestId: request._id,
      donationConsentId: consent._id,
      metadata: {
        disclaimer: "Certificate confirms platform verification records only. B Donor does not collect, test, store, or transfuse blood."
      }
    });

    const noMoneyCertificate = await createCertificate({
      user: donor,
      type: "no_money_declaration",
      bloodRequestId: request._id,
      donationConsentId: consent._id,
      metadata: {
        donorDeclaration: consent.donorDeclaration?.text,
        patientDeclaration: consent.patientDeclaration?.text
      }
    });

    donor.donorCoin.certificates.addToSet(donationCertificate._id);
    donor.donorCoin.certificates.addToSet(noMoneyCertificate._id);
    await donor.save();

    await DonorCoinLedger.create({
      userId: donor._id,
      bloodRequestId: request._id,
      donationId: donation._id,
      certificateId: donationCertificate._id,
      points: DONOR_COIN_REWARD,
      type: "verified_donation",
      description: "Non-cash Donor Coin impact points for a verified voluntary blood donation.",
      hasCashValue: false,
      transferable: false,
      withdrawable: false
    });
  }

  consent.donationId = donation._id;
  consent.finalStatus = "completed";
  consent.adminVerification.status = "verified";
  consent.adminVerification.verifiedBy = verifierId;
  consent.adminVerification.verifiedAt = now;
  await consent.save();

  request.status = "fulfilled";
  request.donationConsentId = consent._id;
  await request.save();

  await LiveTrackingSession.updateMany(
    { bloodRequestId: request._id, status: "active" },
    { $set: { status: "completed", endedAt: now } }
  );

  return { request, consent, donation, donor, certificate: donationCertificate };
}

module.exports = {
  COOLDOWN_DAYS,
  DONOR_COIN_REWARD,
  finalizeDonation
};
