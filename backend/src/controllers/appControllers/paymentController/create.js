const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const custom = require('@/controllers/pdfController');

const { calculate } = require('@/helpers');

const create = async (req, res) => {
  // Creating a new document in the collection
  const amountToRecord = Number(req.body.amount);
  if (!Number.isFinite(amountToRecord) || amountToRecord < 0) {
    return res.status(202).json({
      success: false,
      result: null,
      message: `The Amount cannot be negative`,
    });
  }

  const currentInvoice = await Invoice.findOne({
    _id: req.body.invoice,
    removed: false,
  });

  if (!currentInvoice || !currentInvoice.stockDeducted || ['cancelled', 'reversed'].includes(currentInvoice.status)) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Payments can only be recorded against a posted invoice',
    });
  }

  const {
    total: previousTotal,
    discount: previousDiscount,
    credit: previousCredit,
  } = currentInvoice;

  const maxAmount = calculate.sub(calculate.sub(previousTotal, previousDiscount), previousCredit);

  if (req.body.amount > maxAmount) {
    return res.status(202).json({
      success: false,
      result: null,
      message: `The Max Amount you can add is ${maxAmount}`,
    });
  }
  req.body['createdBy'] = req.admin._id;
  req.body.currency = 'INR';

  const newCredit = calculate.add(previousCredit, amountToRecord);
  const paymentStatus = calculate.sub(previousTotal, previousDiscount) === newCredit ? 'paid' : 'partially';
  const reservedInvoice = await Invoice.findOneAndUpdate(
    {
      _id: currentInvoice._id,
      removed: false,
      stockDeducted: true,
      credit: previousCredit,
      $expr: {
        $gte: [
          { $subtract: [{ $subtract: ['$total', { $ifNull: ['$discount', 0] }] }, { $ifNull: ['$credit', 0] }] },
          amountToRecord,
        ],
      },
    },
    { $inc: { credit: amountToRecord }, $set: { paymentStatus } },
    { new: true }
  );
  if (!reservedInvoice) {
    return res.status(409).json({ success: false, result: null, message: 'Invoice balance changed. Refresh and try again.' });
  }

  let result;
  try {
    result = await Model.create(req.body);
  } catch (error) {
    await Invoice.updateOne(
      { _id: currentInvoice._id, credit: newCredit },
      { $inc: { credit: -amountToRecord }, $set: { paymentStatus: previousCredit > 0 ? 'partially' : 'unpaid' } }
    );
    throw error;
  }

  const fileId = 'payment-' + result._id + '.pdf';
  const updatePath = await Model.findOneAndUpdate(
    {
      _id: result._id.toString(),
      removed: false,
    },
    { pdf: fileId },
    {
      new: true,
    }
  ).exec();
  // Returning successfull response

  await Invoice.updateOne(
    { _id: currentInvoice._id, credit: newCredit },
    { $push: { payment: result._id } }
  );

  return res.status(200).json({
    success: true,
    result: updatePath,
    message: 'Payment Invoice created successfully',
  });
};

module.exports = create;
