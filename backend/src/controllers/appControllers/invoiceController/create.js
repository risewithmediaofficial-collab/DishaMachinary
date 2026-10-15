const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');
const schema = require('./schemaValidate');
const { prepareInvoice } = require('./prepareInvoice');
const { applyInvoiceStock } = require('./invoiceStock');

const create = async (req, res) => {
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

  const { items = [], taxRate = 0, discount = 0, gstEnabled = false } = value;
  let invoiceTotals;
  try {
    invoiceTotals = await prepareInvoice({ items, client: value.client, gstEnabled, taxRate, discount });
  } catch (error) {
    return res.status(400).json({ success: false, result: null, message: error.message });
  }

  Object.assign(body, invoiceTotals, { taxRate, discount });

  let paymentStatus = calculate.sub(invoiceTotals.total, discount) === 0 ? 'paid' : 'unpaid';

  body['paymentStatus'] = paymentStatus;
  body['createdBy'] = req.admin._id;
  body['stockDeducted'] = ['sent', 'posted'].includes(value.status);
  body.currency = 'INR';

  // Creating a new document in the collection
  const result = await new Model(body).save();
  if (result.stockDeducted) {
    try {
      await applyInvoiceStock({
        invoiceId: result._id,
        items: result.items,
        direction: -1,
        createdBy: req.admin._id,
      });
    } catch (error) {
      await Model.deleteOne({ _id: result._id });
      return res.status(400).json({ success: false, result: null, message: error.message });
    }
  }
  const fileId = 'invoice-' + result._id + '.pdf';

  // Automatically record bill in payments
  let paidAmount = 0;
  if (body.paidAmount !== undefined && body.paidAmount !== null && Number(body.paidAmount) >= 0) {
    paidAmount = Number(body.paidAmount);
  } else if (body.paidNow !== undefined && body.paidNow !== null && Number(body.paidNow) >= 0) {
    paidAmount = Number(body.paidNow);
  } else if (['posted', 'sent'].includes(result.status) || result.paymentStatus === 'paid') {
    paidAmount = Number(result.total || 0);
  }

  let paymentRecord = null;
  if (result.status === 'posted' || result.paymentStatus === 'paid' || paidAmount > 0) {
    const Payment = mongoose.model('Payment');
    const paymentNumber = (await Payment.countDocuments({ removed: false })) + 1;
    paymentRecord = await Payment.create({
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
  }

  const newPaymentStatus = paidAmount >= result.total ? 'paid' : (paidAmount > 0 ? 'partially' : result.paymentStatus);
  const updatePayload = {
    pdf: fileId,
    credit: paidAmount,
    paymentStatus: newPaymentStatus,
  };
  if (paymentRecord) {
    updatePayload.$addToSet = { payment: paymentRecord._id };
  }

  const updateResult = await Model.findOneAndUpdate(
    { _id: result._id },
    updatePayload,
    {
      new: true,
    }
  ).exec();
  await mongoose.model('AuditLog').create({
    user: req.admin._id,
    action: result.stockDeducted ? 'invoice.post' : 'invoice.create_draft',
    entity: 'Invoice',
    entityId: result._id,
    changes: { number: result.number, year: result.year, total: result.total, status: result.status },
  });
  // Returning successfull response

  increaseBySettingKey({
    settingKey: 'last_invoice_number',
  });

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result: updateResult,
    message: 'Invoice created successfully',
  });
};

module.exports = create;
