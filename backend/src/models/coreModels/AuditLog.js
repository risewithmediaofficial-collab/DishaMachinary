const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'Admin', required: true },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: mongoose.Schema.ObjectId },
    reason: { type: String, trim: true, default: '' },
    changes: { type: mongoose.Schema.Types.Mixed },
    created: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
