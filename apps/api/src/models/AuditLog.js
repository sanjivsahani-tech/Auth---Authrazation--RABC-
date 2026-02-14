import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // Why: Actor reference links each change back to authenticated principal.
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    module: { type: String, required: true },
    entityId: { type: String },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    meta: {
      ip: String,
      userAgent: String,
      route: String,
      method: String,
    },
    // Why: Indexed creation time keeps recent audit timeline queries fast.
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
