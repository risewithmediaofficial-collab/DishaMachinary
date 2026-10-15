const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    removed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin', required: true },
    date: { type: Date, required: true, default: Date.now },
    category: {
      type: String,
      enum: ['rent', 'salary', 'electricity', 'repairs', 'transport', 'miscellaneous'],
      required: true,
    },
    amount: { type: Number, min: 0.01, required: true },
    paymentAccount: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    attachment: { type: String, trim: true, default: '' },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

expenseSchema.index({ date: -1, category: 1 });
module.exports = mongoose.model('Expense', expenseSchema);
