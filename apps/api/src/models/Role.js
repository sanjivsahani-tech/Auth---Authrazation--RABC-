import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    permissionKeys: [{ type: String, required: true }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Role = mongoose.model('Role', roleSchema);