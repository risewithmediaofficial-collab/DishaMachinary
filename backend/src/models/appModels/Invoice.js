const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },

  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin', required: true },
  number: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  content: String,
  recurring: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'annually', 'quarter'],
  },
  date: {
    type: Date,
    required: true,
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
  converted: {
    from: {
      type: String,
      enum: ['quote', 'offer'],
    },
    offer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Offer',
    },
    quote: {
      type: mongoose.Schema.ObjectId,
      ref: 'Quote',
    },
  },
  items: [
    {
      itemName: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
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
      costPriceSnapshot: { type: Number, min: 0, default: 0 },
      costTotalSnapshot: { type: Number, min: 0, default: 0 },
      stockComponentsSnapshot: [
        {
          product: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
          quantity: { type: Number, min: 0.0001, required: true },
        },
      ],
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
  sellerCountry: { type: String, default: '' },
  buyerState: { type: String, default: '' },
  buyerGstin: { type: String, default: '' },
  buyerCountry: { type: String, default: '' },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  freight: { type: Number, default: 0 },
  vehicleNo: { type: String, default: '' },
  transport: { type: String, default: '' },
  consigneeName: { type: String, default: '' },
  consigneeAddress: { type: String, default: '' },
  consigneeGstin: { type: String, default: '' },
  consigneePhone: { type: String, default: '' },
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
  credit: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  payment: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Payment',
    },
  ],
  paymentStatus: {
    type: String,
    default: 'unpaid',
    enum: ['unpaid', 'paid', 'partially'],
  },
  isOverdue: {
    type: Boolean,
    default: false,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  stockDeducted: { type: Boolean, default: false },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'sent', 'posted', 'reversing', 'reversed', 'refunded', 'cancelled', 'on hold'],
    default: 'draft',
  },
  pdf: {
    type: String,
  },
  files: [
    {
      id: String,
      name: String,
      path: String,
      description: String,
      isPublic: {
        type: Boolean,
        default: true,
      },
    },
  ],
  updated: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

invoiceSchema.index({ year: 1, number: 1 }, { unique: true, partialFilterExpression: { removed: false } });

invoiceSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Invoice', invoiceSchema);
