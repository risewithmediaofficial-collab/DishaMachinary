const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');

const { calculate } = require('@/helpers');

const update = async (req, res) => {
  const currentAmount = Number(req.body.amount);
  if (!Number.isFinite(currentAmount) || currentAmount < 0) {
    return res.status(202).json({
      success: false,
      result: null,
      message: `The Amount cannot be negative`,
    });
  }

  // Find existing payment
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

  const previousAmount = Number(previousPayment.amount || 0);
  const changedAmount = calculate.sub(currentAmount, previousAmount);

  const invoiceId = previousPayment.invoice?._id || previousPayment.invoice;
  const currentInvoice = invoiceId
    ? await Invoice.findOne({ _id: invoiceId, removed: false })
    : null;

  const paymentMode = req.body.paymentMode || req.body.method || previousPayment.method || 'cash';
  const paymentAccount = req.body.paymentAccount !== undefined ? req.body.paymentAccount : (req.body.account || '');

  const updates = {
    number: req.body.number !== undefined ? req.body.number : previousPayment.number,
    date: req.body.date ? new Date(req.body.date) : previousPayment.date,
    amount: currentAmount,
    method: paymentMode,
    account: paymentAccount,
    ref: req.body.ref !== undefined ? req.body.ref : previousPayment.ref,
    description: req.body.description !== undefined ? req.body.description : previousPayment.description,
    updated: new Date(),
  };

  const result = await Model.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: updates },
    {
      new: true,
    }
  ).exec();

  if (currentInvoice && changedAmount !== 0) {
    const newCredit = Math.max(0, calculate.add(currentInvoice.credit || 0, changedAmount));
    const invoiceNetTotal = calculate.sub(currentInvoice.total || 0, currentInvoice.discount || 0);
    const paymentStatus =
      newCredit >= invoiceNetTotal
        ? 'paid'
        : newCredit > 0
        ? 'partially'
        : 'unpaid';

    await Invoice.findOneAndUpdate(
      { _id: currentInvoice._id },
      {
        $set: {
          credit: newCredit,
          paymentStatus: paymentStatus,
        },
      },
      {
        new: true,
      }
    ).exec();
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully updated the Payment',
  });
};

module.exports = update;
