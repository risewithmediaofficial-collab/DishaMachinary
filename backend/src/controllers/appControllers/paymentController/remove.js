const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');

const remove = async (req, res) => {
  // Find document by id and updates with the required fields
  const previousPayment = await Model.findOne({
    _id: req.params.id,
    removed: false,
  });

  if (!previousPayment) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  }

  if (previousPayment.status === 'reversed') {
    return res.status(409).json({ success: false, result: null, message: 'Payment is already reversed' });
  }
  const reason = String(req.body?.reason || '').trim();
  if (!reason) {
    return res.status(400).json({ success: false, result: null, message: 'A reversal reason is required' });
  }

  const { _id: paymentId, amount: previousAmount } = previousPayment;
  const { id: invoiceId, total, discount, credit: previousCredit } = previousPayment.invoice;

  // Find the document by id and delete it
  let updates = { status: 'reversed', reversedAt: new Date(), reversalReason: reason };
  // Find the document by id and delete it
  const result = await Model.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: updates },
    {
      new: true, // return the new result instead of the old one
    }
  ).exec();
  // If no results found, return document not found

  let paymentStatus =
    total - discount === previousCredit - previousAmount
      ? 'paid'
      : previousCredit - previousAmount > 0
      ? 'partially'
      : 'unpaid';

  const updateInvoice = await Invoice.findOneAndUpdate(
    { _id: invoiceId },
    {
      $inc: { credit: -previousAmount },
      $set: {
        paymentStatus: paymentStatus,
      },
    },
    {
      new: true, // return the new result instead of the old one
    }
  ).exec();

  await mongoose.model('AuditLog').create({
    user: req.admin._id,
    action: 'payment.reverse',
    entity: 'Payment',
    entityId: paymentId,
    reason,
    changes: { amount: previousAmount, invoice: invoiceId },
  });

  return res.status(200).json({
    success: true,
    result,
    message: 'Payment reversed successfully',
  });
};
module.exports = remove;
