const mongoose = require('mongoose');

const roundMoney = (amount) => Number((amount + Number.EPSILON).toFixed(2));
const normalizeState = (state) => String(state || '').trim().toLocaleLowerCase();
const isIndia = (country) => {
  if (!country) return true;
  const normalized = normalizeState(country);
  return !normalized || ['in', 'india', 'ind', 'bharat'].includes(normalized);
};

const calculateTotals = (items, gstEnabled, supplyType, invoiceDiscount = 0) => {
  let subTotal = 0;
  let taxTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const taxableBase = roundMoney(
    items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0)
  );
  const safeDiscount = Math.min(Math.max(Number(invoiceDiscount) || 0, 0), taxableBase);
  let allocatedDiscount = 0;

  const calculatedItems = items.map((item, index) => {
    const taxableValue = roundMoney(item.quantity * item.price);
    const discountAllocated = index === items.length - 1
      ? roundMoney(safeDiscount - allocatedDiscount)
      : roundMoney(taxableBase ? (safeDiscount * taxableValue) / taxableBase : 0);
    allocatedDiscount = roundMoney(allocatedDiscount + discountAllocated);
    const discountedTaxableValue = roundMoney(taxableValue - discountAllocated);
    const taxAmount = gstEnabled ? roundMoney((discountedTaxableValue * item.gstRate) / 100) : 0;
    const cgst = supplyType === 'intrastate' ? roundMoney(taxAmount / 2) : 0;
    const sgst = supplyType === 'intrastate' ? roundMoney(taxAmount - cgst) : 0;
    const igst = supplyType === 'interstate' ? taxAmount : 0;

    subTotal = roundMoney(subTotal + taxableValue);
    taxTotal = roundMoney(taxTotal + taxAmount);
    cgstTotal = roundMoney(cgstTotal + cgst);
    sgstTotal = roundMoney(sgstTotal + sgst);
    igstTotal = roundMoney(igstTotal + igst);

    return {
      ...item,
      taxableValue,
      discountAllocated,
      taxAmount,
      cgst,
      sgst,
      igst,
      lineTotal: roundMoney(taxableValue + taxAmount),
      netTotal: roundMoney(discountedTaxableValue + taxAmount),
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
    total: roundMoney(subTotal + taxTotal),
  };
};

const prepareInvoice = async ({ items, client, gstEnabled = false, taxRate = 0, discount = 0 }) => {
  const Product = mongoose.model('Product');
  const Client = mongoose.model('Client');
  const Setting = mongoose.model('Setting');
  const productIds = items.filter((item) => item.product).map((item) => item.product);
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds }, removed: false, enabled: { $ne: false } })
        .select('name sku hsnCode description sellingPrice purchasePrice gstRate trackInventory itemType packageComponents')
        .lean()
    : [];
  const productsById = new Map(products.map((product) => [String(product._id), product]));
  const componentIds = products.flatMap((product) =>
    (product.packageComponents || []).map((component) => component.product)
  );
  const componentProducts = componentIds.length
    ? await Product.find({ _id: { $in: componentIds }, removed: false })
        .select('_id purchasePrice')
        .lean()
    : [];
  const componentCosts = new Map(
    componentProducts.map((component) => [String(component._id), Number(component.purchasePrice || 0)])
  );

  const resolvedItems = items.map((item) => {
    const product = item.product ? productsById.get(String(item.product)) : null;
    if (item.product && !product) {
      throw new Error('A selected product is missing or inactive');
    }

    const quantity = Number(item.quantity);
    const price = product ? Number(product.sellingPrice) : Number(item.price);
    const itemName = product ? product.name : String(item.itemName || '').trim();
    if (!itemName || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) {
      throw new Error('Each invoice item needs a name, positive quantity, and valid price');
    }

    const costPriceSnapshot = product?.itemType === 'package'
      ? roundMoney(
          (product.packageComponents || []).reduce(
            (sum, component) => sum + (componentCosts.get(String(component.product)) || 0) * Number(component.quantity),
            0
          )
        )
      : product
        ? Number(product.purchasePrice || 0)
        : 0;

    return {
      ...(item._id ? { _id: item._id } : {}),
      ...(product ? { product: product._id, sku: product.sku, hsnCode: product.hsnCode } : {}),
      itemName,
      description: item.description || product?.description || '',
      quantity,
      price,
      gstRate: gstEnabled ? Number(product?.gstRate ?? item.gstRate ?? taxRate) : 0,
      costPriceSnapshot,
      costTotalSnapshot: roundMoney(costPriceSnapshot * quantity),
      stockComponentsSnapshot: product?.itemType === 'package'
        ? (product.packageComponents || []).map((component) => ({
            product: component.product,
            quantity: Number(component.quantity),
          }))
        : product?.trackInventory
          ? [{ product: product._id, quantity: 1 }]
          : [],
    };
  });

  let supplyType = 'none';
  let sellerState = '';
  let sellerGstin = '';
  let sellerCountry = '';
  let buyerState = '';
  let buyerGstin = '';
  let buyerCountry = '';
  if (gstEnabled) {
    const clientId = typeof client === 'object' ? client?._id : client;
    const [customer, companySettings] = await Promise.all([
      Client.findOne({ _id: clientId, removed: false }).select('state gstin country').lean(),
      Setting.find({
        settingKey: { $in: ['company_state', 'company_gstin', 'company_country'] },
        removed: false,
      })
        .select('settingKey settingValue')
        .lean(),
    ]);
    const companyValues = Object.fromEntries(
      companySettings.map((setting) => [setting.settingKey, setting.settingValue])
    );
    sellerState = String(companyValues.company_state || 'Tamil Nadu').trim();
    sellerGstin = String(companyValues.company_gstin || '').trim().toUpperCase();
    sellerCountry = String(companyValues.company_country || 'India').trim();
    buyerState = String(customer?.state || sellerState || 'Tamil Nadu').trim();
    buyerGstin = String(customer?.gstin || '').trim().toUpperCase();
    buyerCountry = String(customer?.country || sellerCountry || 'India').trim();

    if (!isIndia(sellerCountry)) sellerCountry = 'India';
    if (!isIndia(buyerCountry)) buyerCountry = 'India';

    const companyState = normalizeState(sellerState) || 'tamil nadu';
    const customerState = normalizeState(buyerState) || companyState;
    supplyType = companyState === customerState ? 'intrastate' : 'interstate';
  }

  return {
    gstEnabled,
    supplyType,
    sellerState,
    sellerGstin,
    sellerCountry,
    buyerState,
    buyerGstin,
    buyerCountry,
    ...calculateTotals(resolvedItems, gstEnabled, supplyType, discount),
  };
};

module.exports = { calculateTotals, prepareInvoice };
