const mongoose = require('mongoose');
const { applyInvoiceStock } = require('./invoiceStock');

const reverse = async (req, res) => {
  const Invoice = mongoose.model('Invoice');
  const reason = String(req.body?.reason || '').trim();
  if (!reason) {
    return res.status(400).json({ success: false, result: null, message: 'A reversal reason is required' });
  }

  const invoice = await Invoice.findOneAndUpdate(
    {
      _id: req.params.id,
      removed: false,
      stockDeducted: true,
      status: { $in: ['sent', 'posted'] },
      credit: 0,
    },
    { $set: { status: 'reversing' } },
    { new: true }
  );
  if (!invoice) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Only an unpaid posted invoice can be reversed. Reverse its payments first.',
    });
  }

  try {
    await applyInvoiceStock({
      invoiceId: invoice._id,
      items: invoice.items,
      direction: 1,
      createdBy: req.admin._id,
    });
    invoice.status = 'reversed';
    invoice.stockDeducted = false;
    invoice.notes = [invoice.notes, `Reversed: ${reason}`].filter(Boolean).join('\n');
    invoice.updated = new Date();
    await invoice.save();
    await mongoose.model('AuditLog').create({
      user: req.admin._id,
      action: 'invoice.reverse',
      entity: 'Invoice',
      entityId: invoice._id,
      reason,
      changes: { number: invoice.number, year: invoice.year, total: invoice.total },
    });
    return res.status(200).json({ success: true, result: invoice, message: 'Invoice reversed and stock restored' });
  } catch (error) {
    await Invoice.updateOne({ _id: invoice._id, status: 'reversing' }, { $set: { status: 'posted' } });
    throw error;
  }
};

module.exports = reverse;
