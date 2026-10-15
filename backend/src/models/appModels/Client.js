const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  name: {
    type: String,
    required: true,
  },
  businessName: { type: String, trim: true, default: '' },
  phone: String,
  country: String,
  state: { type: String, trim: true, default: '' },
  gstin: { type: String, trim: true, uppercase: true, default: '' },
  address: String,
  email: String,
  paymentTermsDays: { type: Number, min: 0, default: 0 },
  creditLimit: { type: Number, min: 0 },
  openingBalance: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  assigned: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

schema.plugin(require('mongoose-autopopulate'));
schema.index({ phone: 1 });

module.exports = mongoose.model('Client', schema);
