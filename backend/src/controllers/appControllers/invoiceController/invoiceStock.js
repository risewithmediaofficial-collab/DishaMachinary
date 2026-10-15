const mongoose = require('mongoose');
const { applyStockMovement } = require('../productController/stockService');

const applyInvoiceStock = async ({ invoiceId, items, direction, createdBy }) => {
  const applied = [];
  try {
    const Product = mongoose.model('Product');
    const productIds = items.filter((item) => item.product).map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds }, removed: false })
      .select('_id itemType packageComponents trackInventory')
      .lean();
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const requirements = new Map();
    for (const item of items) {
      if (!item.product) continue;
      const product = productMap.get(String(item.product));
      if (product?.itemType === 'service' || (!product?.trackInventory && product?.itemType !== 'package')) {
        continue;
      }
      const snapshotComponents = item.stockComponentsSnapshot || [];
      const components = snapshotComponents.length
        ? snapshotComponents
        : product?.itemType === 'package'
          ? product.packageComponents || []
          : [];
      const stockLines = components.length
        ? components.map((component) => ({ product: component.product, quantity: Number(component.quantity) * Number(item.quantity) }))
        : [{ product: item.product, quantity: Number(item.quantity) }];
      for (const line of stockLines) {
        const key = String(line.product);
        requirements.set(key, (requirements.get(key) || 0) + line.quantity);
      }
    }

    for (const [productId, quantity] of requirements) {
      const delta = quantity * direction;
      await applyStockMovement({
        productId,
        delta,
        type: direction < 0 ? 'sale' : 'cancellation',
        referenceType: 'invoice',
        reference: invoiceId,
        note: direction < 0 ? 'Invoice posted' : 'Invoice reversed',
        consumeAvailable: direction < 0,
        createdBy,
      });
      applied.push({ productId, delta });
    }
  } catch (error) {
    for (const movement of applied.reverse()) {
      try {
        await applyStockMovement({
          productId: movement.productId,
          delta: -movement.delta,
          type: movement.delta < 0 ? 'return' : 'sale',
          referenceType: 'invoice',
          reference: invoiceId,
          note: 'Compensation after incomplete invoice stock update',
          consumeAvailable: false,
          createdBy,
        });
      } catch (rollbackError) {
        console.error(`Failed to roll back invoice stock movement: ${rollbackError.message}`);
      }
    }
    throw error;
  }
};

module.exports = { applyInvoiceStock };
