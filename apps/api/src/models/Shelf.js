import mongoose from 'mongoose';

const shelfSchema = new mongoose.Schema(
  {
    // Why: Unique shelf code acts as physical storage identifier in operations.
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    locationNote: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Shelf = mongoose.model('Shelf', shelfSchema);
