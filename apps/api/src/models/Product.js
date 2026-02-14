import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // Why: SKU uniqueness prevents duplicate inventory identities.
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    // Why: Category and shelf references preserve normalized inventory relationships.
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    shelfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelf', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product = mongoose.model('Product', productSchema);
