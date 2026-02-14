import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    // Why: Indexed user reference enables fast session revocation by userId.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    // Risk: Store hash only; raw refresh token should never be persisted.
    tokenHash: { type: String, required: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Behavior: TTL index auto-removes expired token documents without manual cleanup jobs.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
