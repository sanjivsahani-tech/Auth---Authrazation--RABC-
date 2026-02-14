import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    // Why: Unique role names prevent ambiguous assignments and policy drift.
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    // Behavior: Permission keys are evaluated directly by requirePermission middleware.
    permissionKeys: [{ type: String, required: true }],
    // Why: System roles can be protected from destructive admin actions.
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Role = mongoose.model('Role', roleSchema);
