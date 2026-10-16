const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');

const remove = async (req, res) => {
  const previousPayment = await Model.findOne({
    _id: req.params.id,
    removed: false,
  });

  if (!previousPayment) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Payment not found',
    });
  }

  const reason = String(req.body?.reason || 'Payment deleted / reversed').trim();
  const paymentAmount = Number(previousPayment.amount || 0);
  const invoiceId = previousPayment.invoice?._id || previousPayment.invoice;

  // Soft delete payment
  const result = await Model.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    {
      $set: {
        removed: true,
        status: 'reversed',
        reversedAt: new Date(),
        reversalReason: reason,
      },
    },
    { new: true }
  ).exec();

  // If linked to an invoice, deduct credit and update invoice paymentStatus
  if (invoiceId) {
    try {
      const invoice = await Invoice.findOne({ _id: invoiceId, removed: false });
      if (invoice) {
        const currentCredit = Number(invoice.credit || 0);
        const newCredit = Math.max(0, currentCredit - paymentAmount);
        const invoiceTotal = Number(invoice.total || 0);
        const invoiceDiscount = Number(invoice.discount || 0);
        const netPayable = Math.max(0, invoiceTotal - invoiceDiscount);

        const newPaymentStatus =
          newCredit >= netPayable ? 'paid' : newCredit > 0 ? 'partially' : 'unpaid';

        await Invoice.updateOne(
          { _id: invoiceId },
          {
            $set: {
              credit: newCredit,
              paymentStatus: newPaymentStatus,
            },
            $pull: { payment: previousPayment._id },
          }
        );
      }
    } catch (invError) {
      console.error('Warning: could not update invoice credit on payment delete:', invError.message);
    }
  }

  try {
    await mongoose.model('AuditLog').create({
      user: req.admin._id,
      action: 'payment.delete',
      entity: 'Payment',
      entityId: previousPayment._id,
      reason,
      changes: { amount: paymentAmount, invoice: invoiceId },
    });
  } catch (e) {
    // Non-blocking
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Payment deleted successfully',
  });
};

module.exports = remove;
