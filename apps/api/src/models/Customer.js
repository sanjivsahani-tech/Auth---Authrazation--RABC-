import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    address: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Customer = mongoose.model('Customer', customerSchema);