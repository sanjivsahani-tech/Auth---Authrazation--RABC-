import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    // Why: Unique category names simplify lookup and avoid duplicate catalog labels.
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Category = mongoose.model('Category', categorySchema);
