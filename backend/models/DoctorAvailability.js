const mongoose = require("mongoose");

const { Schema } = mongoose;

const DoctorAvailabilitySchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dayOfWeek: String,
    startTime: String,
    endTime: String,
    slotDurationMinutes: { type: Number, default: 20 },
    maxAppointments: { type: Number, default: 12 },
    consultationMode: { type: String, enum: ["clinic", "phone", "video"], default: "clinic" },
    consultationFee: Number,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

DoctorAvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });

module.exports = mongoose.model("DoctorAvailability", DoctorAvailabilitySchema);
