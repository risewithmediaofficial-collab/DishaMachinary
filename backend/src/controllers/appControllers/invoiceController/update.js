const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const custom = require('@/controllers/pdfController');

const { calculate } = require('@/helpers');
const schema = require('./schemaValidate');
const { prepareInvoice } = require('./prepareInvoice');
const { applyInvoiceStock } = require('./invoiceStock');

const update = async (req, res) => {
  let body = req.body;

  const { error, value } = schema.validate(body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const previousInvoice = await Model.findOne({
    _id: req.params.id,
    removed: false,
  });
  if (!previousInvoice) {
    return res.status(404).json({ success: false, result: null, message: 'Invoice not found' });
  }

  const { credit = 0 } = previousInvoice;

  const { items = [], taxRate = 0, discount = 0, gstEnabled = false } = value;

  if (items.length === 0) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Items cannot be empty',
    });
  }

  let invoiceTotals;
  try {
    invoiceTotals = await prepareInvoice({ items, client: value.client, gstEnabled, taxRate, discount });
  } catch (error) {
    return res.status(400).json({ success: false, result: null, message: error.message });
  }

  Object.assign(body, invoiceTotals, { taxRate, discount });

  const inventoryLinesChanged = (left, right) => {
    const signature = (lines) =>
      lines
        .map((item) => `${String(item.product || '')}:${item.quantity}:${item.price}:${item.gstRate || 0}`)
        .sort();
    return JSON.stringify(signature(left || [])) !== JSON.stringify(signature(right || []));
  };

  const shouldDeductStock = ['sent', 'posted'].includes(value.status);

  // Manage stock movements during invoice update
  if (previousInvoice.stockDeducted && shouldDeductStock) {
    // If lines or quantities changed, revert previous stock and apply new stock
    if (inventoryLinesChanged(previousInvoice.items, invoiceTotals.items)) {
      try {
        await applyInvoiceStock({
          invoiceId: previousInvoice._id,
          items: previousInvoice.items,
          direction: 1, // restore previous stock
          createdBy: req.admin._id,
        });
        await applyInvoiceStock({
          invoiceId: previousInvoice._id,
          items: invoiceTotals.items,
          direction: -1, // deduct new stock
          createdBy: req.admin._id,
        });
      } catch (error) {
        return res.status(400).json({ success: false, result: null, message: error.message });
      }
    }
  } else if (previousInvoice.stockDeducted && !shouldDeductStock) {
    try {
      await applyInvoiceStock({
        invoiceId: previousInvoice._id,
        items: previousInvoice.items,
        direction: 1, // restore stock
        createdBy: req.admin._id,
      });
    } catch (error) {
      return res.status(400).json({ success: false, result: null, message: error.message });
    }
  } else if (!previousInvoice.stockDeducted && shouldDeductStock) {
    try {
      await applyInvoiceStock({
        invoiceId: previousInvoice._id,
        items: invoiceTotals.items,
        direction: -1, // deduct stock
        createdBy: req.admin._id,
      });
    } catch (error) {
      return res.status(400).json({ success: false, result: null, message: error.message });
    }
  }

  body.stockDeducted = shouldDeductStock;
  body['pdf'] = 'invoice-' + req.params.id + '.pdf';
  if (body.hasOwnProperty('currency')) {
    delete body.currency;
  }

  let paymentStatus =
    calculate.sub(invoiceTotals.total, discount) <= credit
      ? 'paid'
      : credit > 0
        ? 'partially'
        : 'unpaid';
  body['paymentStatus'] = paymentStatus;

  let result;
  result = await Model.findOneAndUpdate({ _id: req.params.id, removed: false }, body, {
    new: true,
    runValidators: true,
  }).exec();

  // Ensure posted/paid invoice has a payment record
  if (result && (result.status === 'posted' || result.paymentStatus === 'paid')) {
    const Payment = mongoose.model('Payment');
    const existingPayment = await Payment.findOne({ invoice: result._id, removed: false });
    if (!existingPayment) {
      const paymentNumber = (await Payment.countDocuments({ removed: false })) + 1;
      const paidAmount = Number(result.total || 0);
      const paymentRecord = await Payment.create({
        number: paymentNumber,
        client: result.client,
        invoice: result._id,
        date: result.date || new Date(),
        amount: paidAmount,
        method: body.paymentMethod || 'cash',
        currency: result.currency || 'INR',
        createdBy: req.admin._id,
        status: 'posted',
        ref: `Bill #${result.number}/${result.year}`,
        description: `Payment recorded for Bill #${result.number}/${result.year}`,
      });
      const paymentPdf = 'payment-' + paymentRecord._id + '.pdf';
      await Payment.updateOne({ _id: paymentRecord._id }, { pdf: paymentPdf });
      await Model.updateOne(
        { _id: result._id },
        { $set: { credit: paidAmount, paymentStatus: 'paid' }, $addToSet: { payment: paymentRecord._id } }
      );
    }
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'we update this document ',
  });
};

module.exports = update;
