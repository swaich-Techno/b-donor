const mongoose = require("mongoose");

const { Schema } = mongoose;

const AppointmentRequestSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User" },
    hospitalId: { type: Schema.Types.ObjectId, ref: "User" },
    requestedFor: { type: String, enum: ["doctor", "hospital"], required: true },
    specialization: String,
    symptomsSummary: String,
    aiSummaryId: String,
    medicalReportIds: [{ type: Schema.Types.ObjectId, ref: "MedicalReport" }],
    preferredDate: Date,
    preferredTime: String,
    consultationMode: { type: String, enum: ["clinic", "phone", "video"], default: "clinic" },
    consultationFeeShown: Number,
    platformFee: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid", "refunded"],
      default: "not_required"
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed", "no_show"],
      default: "pending"
    },
    patientConsentToShareMedicalData: { type: Boolean, default: false },
    doctorNotes: String,
    rejectionReason: String
  },
  { timestamps: true }
);

AppointmentRequestSchema.index({ patientId: 1, createdAt: -1 });
AppointmentRequestSchema.index({ doctorId: 1, status: 1 });
AppointmentRequestSchema.index({ hospitalId: 1, status: 1 });

module.exports = mongoose.model("AppointmentRequest", AppointmentRequestSchema);
