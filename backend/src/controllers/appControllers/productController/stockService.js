const mongoose = require('mongoose');

const Product = mongoose.model('Product');
const StockMovement = mongoose.model('StockMovement');

const applyStockMovement = async ({
  productId,
  delta,
  type,
  referenceType = 'manual',
  reference,
  note = '',
  reason = '',
  location = '',
  unitCost = 0,
  consumeAvailable = false,
  createdBy,
}) => {
  const amount = Number(delta);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error('Stock movement quantity must be a non-zero number');
  }

  const currentProduct = await Product.findOne({ _id: productId, removed: false }).lean();
  if (!currentProduct) {
    throw new Error('Product not found');
  }
  if (!currentProduct.trackInventory) {
    throw new Error('Inventory tracking is disabled for this product');
  }

  const filter = { _id: productId, removed: false };
  if (amount < 0) {
    filter.$expr = consumeAvailable
      ? {
          $gte: [
            { $subtract: [{ $ifNull: ['$stockQuantity', 0] }, { $ifNull: ['$reservedQuantity', 0] }] },
            Math.abs(amount),
          ],
        }
      : { $gte: [{ $ifNull: ['$stockQuantity', 0] }, Math.abs(amount)] };
  }

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { stockQuantity: amount }, $set: { updated: new Date() } },
    { new: true, runValidators: true }
  ).exec();

  if (!product) {
    throw new Error(consumeAvailable ? 'Insufficient available stock for this product' : 'Insufficient stock for this product');
  }

  const stockBefore = Number(product.stockQuantity) - amount;

  try {
    const movement = await StockMovement.create({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      type,
      quantity: Math.abs(amount),
      delta: amount,
      stockBefore,
      stockAfter: product.stockQuantity,
      referenceType,
      reference,
      note,
      reason,
      location,
      unitCost,
      createdBy,
    });
    return { product, movement };
  } catch (error) {
    await Product.updateOne(
      { _id: product._id, stockQuantity: product.stockQuantity },
      { $inc: { stockQuantity: -amount } }
    );
    throw error;
  }
};

module.exports = { applyStockMovement };
