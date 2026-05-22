const mongoose = require("mongoose");

const { Schema } = mongoose;

const CSRPartnerSchema = new Schema(
  {
    organizationName: { type: String, required: true },
    contactPerson: String,
    phone: String,
    email: String,
    sponsorshipType: {
      type: String,
      enum: ["awareness_drive", "certificate_sponsor", "district_campaign", "blood_camp", "technology_access"]
    },
    amountCommitted: Number,
    campaignTitle: String,
    campaignArea: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ["draft", "active", "completed", "cancelled"], default: "draft" },
    logoUrl: String,
    publicVisibility: { type: Boolean, default: false }
  },
  { timestamps: true }
);

CSRPartnerSchema.index({ status: 1, publicVisibility: 1 });

module.exports = mongoose.model("CSRPartner", CSRPartnerSchema);
