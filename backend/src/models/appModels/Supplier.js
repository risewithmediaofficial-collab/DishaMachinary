const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  name: {
    type: String,
    trim: true,
    required: true,
  },
  company: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  state: {
    type: String,
    trim: true,
    default: 'Tamil Nadu',
  },
  pincode: {
    type: String,
    trim: true,
    default: '',
  },
  country: {
    type: String,
    trim: true,
    default: 'India',
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true,
    default: '',
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    default: '',
  },
  cstNo: {
    type: String,
    trim: true,
    default: '',
  },
  dlNo1: {
    type: String,
    trim: true,
    default: '',
  },
  dlNo2: {
    type: String,
    trim: true,
    default: '',
  },
  openingBalance: {
    type: Number,
    default: 0,
  },
  creditLimit: {
    type: Number,
    default: 0,
  },
  bankName: {
    type: String,
    trim: true,
    default: '',
  },
  bankAccount: {
    type: String,
    trim: true,
    default: '',
  },
  bankIfsc: {
    type: String,
    trim: true,
    uppercase: true,
    default: '',
  },
  bankBranch: {
    type: String,
    trim: true,
    default: '',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
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

supplierSchema.plugin(require('mongoose-autopopulate'));
supplierSchema.index({ phone: 1 });
supplierSchema.index({ name: 'text', company: 'text', phone: 'text', gstin: 'text' });

module.exports = mongoose.model('Supplier', supplierSchema);
