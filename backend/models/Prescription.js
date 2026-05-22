const mongoose = require("mongoose");

const { Schema } = mongoose;

const PrescriptionSchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "AppointmentRequest" },
    symptomsSummary: String,
    diagnosisByDoctor: String,
    diagnosisNotes: String,
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    testsRecommended: [{ type: String }],
    advice: String,
    followUpDate: Date,
    doctorRegistrationNumber: String,
    followUpAdvice: String,
    status: { type: String, enum: ["active", "cancelled"], default: "active" }
  },
  { timestamps: true }
);

PrescriptionSchema.index({ patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });

module.exports = mongoose.model("Prescription", PrescriptionSchema);
