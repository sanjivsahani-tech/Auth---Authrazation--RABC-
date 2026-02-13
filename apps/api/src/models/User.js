import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);