const mongoose = require("mongoose");

const { Schema } = mongoose;

const MedicalReportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: String,
    fileName: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
    reportDate: Date,
    reportCategory: String,
    aiSummary: String,
    detectedPossibleIssues: [{ type: String }],
    redFlags: [{ type: String }],
    extractedText: String,
    doctorNotes: String,
    visibility: {
      type: String,
      enum: ["private", "shared_with_doctor"],
      default: "private"
    }
  },
  { timestamps: true }
);

MedicalReportSchema.index({ userId: 1, uploadedAt: -1 });

module.exports = mongoose.model("MedicalReport", MedicalReportSchema);
