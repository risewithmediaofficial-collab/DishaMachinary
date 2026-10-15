const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    removed: {
      type: Boolean,
      default: false,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin', required: true },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
      unique: true,
    },
    hsnCode: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    category: { type: String, trim: true, default: '' },
    subcategory: { type: String, trim: true, default: '' },
    brand: { type: String, trim: true, default: '' },
    modelNumber: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    brochure: { type: String, trim: true, default: '' },
    barcode: {
      type: String,
      trim: true,
      set: (value) => String(value || '').trim() || undefined,
    },
    itemType: {
      type: String,
      enum: ['product', 'service', 'package'],
      default: 'product',
    },
    specifications: {
      capacity: { type: String, trim: true, default: '' },
      power: { type: String, trim: true, default: '' },
      voltage: { type: String, trim: true, default: '' },
      phase: { type: String, trim: true, default: '' },
      dimensions: { type: String, trim: true, default: '' },
      material: { type: String, trim: true, default: '' },
    },
    unit: {
      type: String,
      trim: true,
      default: 'pcs',
    },
    purchasePrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
      required: true,
    },
    wholesalePrice: { type: Number, min: 0 },
    taxInclusive: { type: Boolean, default: false },
    gstRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    stockQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    reservedQuantity: { type: Number, min: 0, default: 0 },
    damagedQuantity: { type: Number, min: 0, default: 0 },
    reorderLevel: {
      type: Number,
      min: 0,
      default: 0,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    serialTracking: { type: Boolean, default: false },
    warranty: {
      durationMonths: { type: Number, min: 0, default: 0 },
      coverage: { type: String, default: '' },
      provider: { type: String, default: '' },
    },
    variants: [
      {
        name: { type: String, trim: true, required: true },
        sku: { type: String, trim: true, uppercase: true, required: true },
        barcode: { type: String, trim: true, default: '' },
        purchasePrice: { type: Number, min: 0, default: 0 },
        sellingPrice: { type: Number, min: 0, required: true },
        wholesalePrice: { type: Number, min: 0 },
        stockQuantity: { type: Number, min: 0, default: 0 },
        reservedQuantity: { type: Number, min: 0, default: 0 },
      },
    ],
    packageComponents: [
      {
        product: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, min: 0.0001, required: true },
      },
    ],
    created: {
      type: Date,
      default: Date.now,
    },
    updated: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

productSchema.index({ name: 1 });
productSchema.index({ modelNumber: 1 });
productSchema.index({ barcode: 1 }, { unique: true, sparse: true });
productSchema.index({ 'variants.sku': 1 }, { sparse: true });

module.exports = mongoose.model('Product', productSchema);
