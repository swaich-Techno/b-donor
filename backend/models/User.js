const mongoose = require("mongoose");

const { Schema } = mongoose;

const LocationSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number],
      validate: {
        validator(value) {
          return !value || value.length === 0 || value.length === 2;
        },
        message: "Coordinates must be [longitude, latitude]."
      }
    },
    address: String,
    village: String,
    city: String,
    district: String,
    state: String,
    country: { type: String, default: "India" },
    pincode: String,
    locationSource: { type: String, enum: ["gps", "manual"], default: "manual" }
  },
  { _id: false }
);

const ConsentSchema = new Schema(
  {
    privacyAccepted: { type: Boolean, default: false },
    medicalDataAccepted: { type: Boolean, default: false },
    locationAccepted: { type: Boolean, default: false },
    liveTrackingAccepted: { type: Boolean, default: false },
    donorConsentAccepted: { type: Boolean, default: false },
    whatsappSmsConsentAccepted: { type: Boolean, default: false },
    certificatePublicVerificationAccepted: { type: Boolean, default: false },
    appointmentDataSharingAccepted: { type: Boolean, default: false }
  },
  { _id: false }
);

const MedicalHistorySchema = new Schema(
  {
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    currentMedications: [{ type: String }],
    previousSurgeries: [{ type: String }],
    symptomsNotes: [{ note: String, createdAt: { type: Date, default: Date.now } }],
    familyHistory: [{ type: String }],
    uploadedReports: [{ type: Schema.Types.ObjectId, ref: "MedicalReport" }]
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    gender: String,
    age: Number,
    dateOfBirth: Date,
    bloodGroup: { type: String, uppercase: true, trim: true },
    profileImage: String,
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    profileCompletionScore: { type: Number, default: 20 },
    accountType: {
      type: String,
      enum: ["patient", "donor", "doctor", "hospital", "admin"],
      default: "patient"
    },
    isPatient: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    location: { type: LocationSchema, default: () => ({ type: "Point" }) },
    consent: { type: ConsentSchema, default: () => ({}) },
    medicalHistory: { type: MedicalHistorySchema, default: () => ({}) },
    donorProfile: {
      enabled: { type: Boolean, default: false },
      approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
      },
      isAvailable: { type: Boolean, default: false },
      lastDonationDate: Date,
      cooldownUntil: Date,
      nextEligibleDonationDate: Date,
      totalDonations: { type: Number, default: 0 },
      donationCount: { type: Number, default: 0 },
      preferredRadiusKm: { type: Number, default: 10 },
      canReceiveWhatsApp: { type: Boolean, default: true },
      canReceiveSMS: { type: Boolean, default: false },
      emergencyAvailability: { type: Boolean, default: false },
      healthEligibilityStatus: {
        type: String,
        enum: ["unknown", "eligible", "temporarily_ineligible", "needs_review"],
        default: "unknown"
      },
      recoveryTipsSent: { type: Boolean, default: false },
      temporaryUnavailableReason: String,
      rejectionReason: String
    },
    doctorProfile: {
      enabled: { type: Boolean, default: false },
      approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
      },
      qualification: String,
      specialization: String,
      experience: Number,
      medicalRegistrationNumber: String,
      issuingMedicalCouncil: String,
      currentHospitalClinic: String,
      currentWorkingCity: String,
      consultationFee: Number,
      consultationModes: [{ type: String }],
      availableDays: [{ type: String }],
      availableTimings: String,
      languagesSpoken: [{ type: String }],
      documents: [{ type: String }],
      about: String,
      verifiedBadge: { type: Boolean, default: false },
      appointmentEnabled: { type: Boolean, default: false },
      directCallEnabled: { type: Boolean, default: true },
      rejectionReason: String
    },
    hospitalProfile: {
      enabled: { type: Boolean, default: false },
      approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
      },
      hospitalName: String,
      registrationNumber: String,
      hospitalType: String,
      contactPerson: String,
      emergencyPhone: String,
      departments: [{ type: String }],
      timings: String,
      documents: [{ type: String }],
      bloodBankAvailable: { type: Boolean, default: false },
      about: String,
      verifiedBadge: { type: Boolean, default: false },
      appointmentEnabled: { type: Boolean, default: false },
      directCallEnabled: { type: Boolean, default: true },
      rejectionReason: String
    },
    donorCoin: {
      impactPoints: { type: Number, default: 0 },
      level: { type: String, default: "New Helper" },
      badges: [{ type: String }],
      certificates: [{ type: Schema.Types.ObjectId, ref: "Certificate" }]
    },
    subscription: {
      planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan" },
      status: { type: String, enum: ["none", "trial", "active", "expired", "cancelled"], default: "none" },
      expiresAt: Date
    }
  },
  { timestamps: true }
);

UserSchema.index({ location: "2dsphere" });
UserSchema.index({ bloodGroup: 1, "donorProfile.approvalStatus": 1, "donorProfile.isAvailable": 1 });

UserSchema.methods.toSafeJSON = function toSafeJSON() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", UserSchema);
