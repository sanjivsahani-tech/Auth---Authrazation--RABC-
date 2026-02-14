import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Why: Unique lowercase email is the primary login identifier.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    // Risk: This field must always store hashed values, never plaintext.
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    // Why: Role references drive runtime permission resolution in auth middleware.
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
