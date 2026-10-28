const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  number: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  content: String,
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiredDate: {
    type: Date,
    required: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  items: [
    {
      product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
      itemName: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      sku: String,
      hsnCode: String,
      quantity: {
        type: Number,
        default: 1,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
      gstRate: { type: Number, min: 0, max: 100, default: 0 },
      taxableValue: { type: Number, min: 0, default: 0 },
      taxAmount: { type: Number, min: 0, default: 0 },
      cgst: { type: Number, min: 0, default: 0 },
      sgst: { type: Number, min: 0, default: 0 },
      igst: { type: Number, min: 0, default: 0 },
      lineTotal: { type: Number, min: 0, default: 0 },
      discountAllocated: { type: Number, min: 0, default: 0 },
      netTotal: { type: Number, min: 0, default: 0 },
    },
  ],
  taxRate: {
    type: Number,
    default: 0,
  },
  subTotal: {
    type: Number,
    default: 0,
  },
  taxTotal: {
    type: Number,
    default: 0,
  },
  gstEnabled: { type: Boolean, default: false },
  supplyType: { type: String, enum: ['none', 'intrastate', 'interstate'], default: 'none' },
  sellerState: { type: String, default: '' },
  sellerGstin: { type: String, default: '' },
  buyerState: { type: String, default: '' },
  buyerGstin: { type: String, default: '' },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  freight: { type: Number, default: 0 },
  vehicleNo: { type: String, default: '' },
  transport: { type: String, default: '' },
  total: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'declined', 'converted', 'expired'],
    default: 'draft',
  },
  isConverted: {
    type: Boolean,
    default: false,
  },
  convertedToInvoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice',
  },
  notes: {
    type: String,
    default: '',
  },
  pdf: {
    type: String,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

quoteSchema.index({ year: 1, number: 1 }, { unique: true, partialFilterExpression: { removed: false } });
quoteSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Quote', quoteSchema);
