const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    type: {
      type: String,
      enum: ['opening', 'purchase', 'sale', 'adjustment', 'return', 'cancellation', 'transfer', 'damage', 'quarantine', 'service'],
      required: true,
    },
    quantity: { type: Number, min: 0, required: true },
    delta: { type: Number, required: true },
    stockBefore: { type: Number, min: 0, required: true },
    stockAfter: { type: Number, min: 0, required: true },
    referenceType: { type: String, enum: ['invoice', 'manual', 'opening', 'purchase', 'return', 'service', 'transfer'], default: 'manual' },
    reference: { type: mongoose.Schema.ObjectId },
    note: { type: String, default: '' },
    reason: { type: String, default: '' },
    location: { type: String, trim: true, default: '' },
    unitCost: { type: Number, min: 0, default: 0 },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin', required: true },
    created: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

stockMovementSchema.index({ product: 1, created: -1 });
stockMovementSchema.index({ referenceType: 1, reference: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
