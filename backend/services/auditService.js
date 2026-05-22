const AuditLog = require("../models/AuditLog");

async function logAudit(req, { action, targetType, targetId, metadata = {} }) {
  try {
    await AuditLog.create({
      actorId: req.user?._id,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get?.("user-agent")
    });
  } catch (error) {
    console.warn("Audit log failed:", error.message);
  }
}

module.exports = { logAudit };
