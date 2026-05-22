const mongoose = require("mongoose");

const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    targetType: String,
    targetId: Schema.Types.ObjectId,
    metadata: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
