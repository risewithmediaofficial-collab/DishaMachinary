const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');
const ModelPayment = mongoose.model('Payment');
const { applyInvoiceStock } = require('./invoiceStock');

const remove = async (req, res) => {
  const invoice = await Model.findOne({ _id: req.params.id, removed: false });
  if (!invoice) {
    return res.status(404).json({ success: false, result: null, message: 'Invoice not found' });
  }

  // Restore inventory stock if stock was previously deducted
  if (invoice.stockDeducted && Array.isArray(invoice.items) && invoice.items.length > 0) {
    try {
      await applyInvoiceStock({
        invoiceId: invoice._id,
        items: invoice.items,
        direction: 1, // Restore deducted inventory
        createdBy: req.admin._id,
      });
    } catch (stockError) {
      console.error('Warning: could not restore stock on invoice deletion:', stockError.message);
    }
  }

  // Soft delete invoice
  const deletedInvoice = await Model.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    {
      $set: {
        removed: true,
        status: 'cancelled',
      },
    },
    { new: true }
  ).exec();

  if (!deletedInvoice) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Invoice not found',
    });
  }

  // Also soft-delete any payments recorded for this invoice
  await ModelPayment.updateMany(
    { invoice: deletedInvoice._id },
    {
      $set: {
        removed: true,
        status: 'reversed',
        reversedAt: new Date(),
        reversalReason: 'Invoice deleted',
      },
    }
  );

  try {
    await mongoose.model('AuditLog').create({
      user: req.admin._id,
      action: 'invoice.delete',
      entity: 'Invoice',
      entityId: deletedInvoice._id,
      changes: { number: deletedInvoice.number, year: deletedInvoice.year, total: deletedInvoice.total },
    });
  } catch (e) {
    // Non-blocking
  }

  return res.status(200).json({
    success: true,
    result: deletedInvoice,
    message: 'Invoice deleted successfully',
  });
};

module.exports = remove;
