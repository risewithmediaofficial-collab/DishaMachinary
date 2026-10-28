const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const { generatePdf } = require('@/controllers/pdfController');

const Quote = mongoose.model('Quote');
const Invoice = mongoose.model('Invoice');
const Client = mongoose.model('Client');
const Product = mongoose.model('Product');

const methods = createCRUDController('Quote');

const calculateQuoteTotals = (items, gstEnabled, supplyType, discount = 0) => {
  const round = (val) => Number((Number(val || 0) + Number.EPSILON).toFixed(2));
  let subTotal = 0;
  let taxTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const taxableBase = round(
    items.reduce((sum, item) => sum + Number(item.quantity || 1) * Number(item.price || 0), 0)
  );
  const safeDiscount = Math.min(Math.max(Number(discount) || 0, 0), taxableBase);
  let allocatedDiscount = 0;

  const calculatedItems = items.map((item, idx) => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const taxableValue = round(qty * price);
    const discountAllocated = idx === items.length - 1
      ? round(safeDiscount - allocatedDiscount)
      : round(taxableBase ? (safeDiscount * taxableValue) / taxableBase : 0);
    allocatedDiscount = round(allocatedDiscount + discountAllocated);
    const discountedTaxableValue = round(taxableValue - discountAllocated);

    const gstRate = Number(item.gstRate || 0);
    const taxAmount = gstEnabled ? round((discountedTaxableValue * gstRate) / 100) : 0;
    const cgst = supplyType === 'intrastate' ? round(taxAmount / 2) : 0;
    const sgst = supplyType === 'intrastate' ? round(taxAmount - cgst) : 0;
    const igst = supplyType === 'interstate' ? taxAmount : 0;

    subTotal = round(subTotal + taxableValue);
    taxTotal = round(taxTotal + taxAmount);
    cgstTotal = round(cgstTotal + cgst);
    sgstTotal = round(sgstTotal + sgst);
    igstTotal = round(igstTotal + igst);

    return {
      ...item,
      quantity: qty,
      price: price,
      taxableValue,
      discountAllocated,
      taxAmount,
      cgst,
      sgst,
      igst,
      lineTotal: round(taxableValue + taxAmount),
      netTotal: round(discountedTaxableValue + taxAmount),
      total: taxableValue,
    };
  });

  return {
    items: calculatedItems,
    subTotal,
    taxTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    total: round(Math.max(0, subTotal - safeDiscount) + taxTotal),
  };
};

methods.create = async (req, res) => {
  const { client, items, date, expiredDate, gstEnabled, discount, supplyType, buyerState, buyerGstin, notes, vehicleNo, transport, freight } = req.body;

  if (!client) {
    return res.status(400).json({ success: false, result: null, message: 'Client is required for quotation' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, result: null, message: 'At least one product item is required for quotation' });
  }

  const currentYear = new Date().getFullYear();
  const lastQuote = await Quote.findOne({ year: currentYear }).sort({ number: -1 }).exec();
  const nextNumber = lastQuote && lastQuote.number ? lastQuote.number + 1 : 1;

  const quoteDate = date ? new Date(date) : new Date();
  const quoteExpDate = expiredDate ? new Date(expiredDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const isGst = Boolean(gstEnabled);
  const resolvedSupplyType = supplyType || (isGst ? 'intrastate' : 'none');

  const calc = calculateQuoteTotals(items, isGst, resolvedSupplyType, discount || 0);

  const newQuote = new Quote({
    number: nextNumber,
    year: currentYear,
    date: quoteDate,
    expiredDate: quoteExpDate,
    client,
    items: calc.items,
    subTotal: calc.subTotal,
    taxTotal: calc.taxTotal,
    cgstTotal: calc.cgstTotal,
    sgstTotal: calc.sgstTotal,
    igstTotal: calc.igstTotal,
    total: calc.total + Number(freight || 0),
    freight: Number(freight || 0),
    discount: Number(discount || 0),
    gstEnabled: isGst,
    supplyType: resolvedSupplyType,
    buyerState: buyerState || 'Tamil Nadu',
    buyerGstin: buyerGstin || '',
    notes: notes || '',
    vehicleNo: vehicleNo || '',
    transport: transport || '',
    status: req.body.status || 'draft',
    createdBy: req.admin?._id,
  });

  const result = await newQuote.save();
  return res.status(200).json({
    success: true,
    result,
    message: 'Quotation created successfully',
  });
};

methods.update = async (req, res) => {
  const { items, gstEnabled, discount, supplyType, freight } = req.body;
  let updateData = { ...req.body, updated: new Date() };

  if (items && Array.isArray(items)) {
    const isGst = Boolean(gstEnabled);
    const resolvedSupplyType = supplyType || (isGst ? 'intrastate' : 'none');
    const calc = calculateQuoteTotals(items, isGst, resolvedSupplyType, discount || 0);
    updateData = {
      ...updateData,
      items: calc.items,
      subTotal: calc.subTotal,
      taxTotal: calc.taxTotal,
      cgstTotal: calc.cgstTotal,
      sgstTotal: calc.sgstTotal,
      igstTotal: calc.igstTotal,
      total: calc.total + Number(freight || 0),
    };
  }

  const result = await Quote.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: updateData },
    { new: true, runValidators: true }
  ).exec();

  if (!result) {
    return res.status(404).json({ success: false, result: null, message: 'Quotation not found' });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Quotation updated successfully',
  });
};

methods.convert = async (req, res) => {
  const quote = await Quote.findOne({ _id: req.params.id, removed: false }).exec();
  if (!quote) {
    return res.status(404).json({ success: false, result: null, message: 'Quotation not found' });
  }

  if (quote.isConverted && quote.convertedToInvoice) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'This quotation has already been converted to an invoice',
    });
  }

  const currentYear = new Date().getFullYear();
  const lastInvoice = await Invoice.findOne({ year: currentYear }).sort({ number: -1 }).exec();
  const nextInvoiceNumber = lastInvoice && lastInvoice.number ? lastInvoice.number + 1 : 1;

  const invoiceItems = quote.items.map((item) => ({
    product: item.product,
    itemName: item.itemName,
    description: item.description,
    sku: item.sku,
    hsnCode: item.hsnCode,
    quantity: item.quantity,
    price: item.price,
    total: item.total,
    gstRate: item.gstRate,
    taxableValue: item.taxableValue,
    taxAmount: item.taxAmount,
    cgst: item.cgst,
    sgst: item.sgst,
    igst: item.igst,
    lineTotal: item.lineTotal,
    discountAllocated: item.discountAllocated,
    netTotal: item.netTotal,
  }));

  const invoice = new Invoice({
    number: nextInvoiceNumber,
    year: currentYear,
    date: new Date(),
    expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    client: quote.client,
    converted: {
      from: 'quote',
      quote: quote._id,
    },
    items: invoiceItems,
    subTotal: quote.subTotal,
    taxTotal: quote.taxTotal,
    gstEnabled: quote.gstEnabled,
    supplyType: quote.supplyType,
    sellerState: quote.sellerState || 'Tamil Nadu',
    sellerGstin: quote.sellerGstin || '',
    buyerState: quote.buyerState || 'Tamil Nadu',
    buyerGstin: quote.buyerGstin || '',
    cgstTotal: quote.cgstTotal,
    sgstTotal: quote.sgstTotal,
    igstTotal: quote.igstTotal,
    freight: quote.freight || 0,
    vehicleNo: quote.vehicleNo || '',
    transport: quote.transport || '',
    total: quote.total,
    currency: quote.currency || 'INR',
    discount: quote.discount || 0,
    credit: 0,
    paymentStatus: 'unpaid',
    status: 'draft',
    notes: `Converted from Quotation #${quote.number}/${quote.year}. ${quote.notes || ''}`.trim(),
    createdBy: req.admin?._id,
  });

  const savedInvoice = await invoice.save();

  quote.isConverted = true;
  quote.convertedToInvoice = savedInvoice._id;
  quote.status = 'converted';
  quote.updated = new Date();
  await quote.save();

  return res.status(200).json({
    success: true,
    result: {
      invoice: savedInvoice,
      quote,
    },
    message: `Quotation #${quote.number} successfully converted to Invoice #${savedInvoice.number}/${savedInvoice.year}`,
  });
};

methods.summary = async (req, res) => {
  const [totalQuotes, convertedQuotes, acceptedQuotes, pendingQuotes, quotesAgg] = await Promise.all([
    Quote.countDocuments({ removed: false }),
    Quote.countDocuments({ removed: false, status: 'converted' }),
    Quote.countDocuments({ removed: false, status: 'accepted' }),
    Quote.countDocuments({ removed: false, status: { $in: ['draft', 'sent'] } }),
    Quote.aggregate([
      { $match: { removed: false } },
      { $group: { _id: null, totalValue: { $sum: '$total' } } },
    ]),
  ]);

  const totalValue = quotesAgg.length > 0 ? quotesAgg[0].totalValue : 0;
  const conversionRate = totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0;

  return res.status(200).json({
    success: true,
    result: {
      totalQuotes,
      convertedQuotes,
      acceptedQuotes,
      pendingQuotes,
      totalValue,
      conversionRate,
    },
    message: 'Quotation summary fetched successfully',
  });
};

module.exports = methods;
