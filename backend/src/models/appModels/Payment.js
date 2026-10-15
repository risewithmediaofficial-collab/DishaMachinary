const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },

  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin', autopopulate: true, required: true },
  number: {
    type: Number,
    required: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    autopopulate: true,
    required: true,
  },
  invoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice',
    required: true,
    autopopulate: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'card', 'credit', 'other'],
    default: 'cash',
  },
  account: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['posted', 'reversed'], default: 'posted' },
  reversedAt: Date,
  reversalReason: { type: String, trim: true, default: '' },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
    required: true,
  },
  ref: {
    type: String,
  },
  description: {
    type: String,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});
paymentSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Payment', paymentSchema);
