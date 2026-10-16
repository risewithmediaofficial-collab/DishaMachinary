const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const { applyStockMovement } = require('./stockService');

const Product = mongoose.model('Product');
const StockMovement = mongoose.model('StockMovement');
const methods = createCRUDController('Product');

methods.create = async (req, res) => {
  const openingStock = Number(req.body.openingStock || 0);
  if (!Number.isFinite(openingStock) || openingStock < 0) {
    return res.status(400).json({ success: false, result: null, message: 'Invalid opening stock' });
  }

  const { openingStock: ignoredOpeningStock, stockQuantity: ignoredStockQuantity, ...body } = req.body;
  const trackInventory = body.itemType === 'service' ? false : body.trackInventory ?? true;
  if (!trackInventory && openingStock > 0) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Opening stock cannot be set for a non-stock service',
    });
  }
  const product = await new Product({
    ...body,
    createdBy: req.admin._id,
    trackInventory,
    stockQuantity: 0,
    removed: false,
  }).save();

  try {
    if (openingStock > 0) {
      await applyStockMovement({
        productId: product._id,
        delta: openingStock,
        type: 'opening',
        referenceType: 'opening',
        note: 'Opening stock',
        createdBy: req.admin._id,
      });
    }
  } catch (error) {
    await Product.deleteOne({ _id: product._id });
    throw error;
  }

  const result = await Product.findById(product._id).exec();
  return res.status(200).json({ success: true, result, message: 'Product created successfully' });
};

methods.update = async (req, res) => {
  if (Object.hasOwn(req.body, 'stockQuantity') || Object.hasOwn(req.body, 'openingStock')) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Adjust stock through the stock adjustment action',
    });
  }
  return createCRUDController('Product').update(req, res);
};

methods.delete = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, removed: false });
  if (product?.trackInventory && product.stockQuantity > 0) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Products with stock cannot be deleted. Adjust stock to zero first.',
    });
  }
  return createCRUDController('Product').delete(req, res);
};

methods.deleteMany = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'No IDs provided for batch deletion',
    });
  }

  // Check if any selected products have active inventory stock
  const productsWithStock = await Product.find({
    _id: { $in: ids },
    removed: false,
    trackInventory: true,
    stockQuantity: { $gt: 0 },
  });

  const idsWithStock = productsWithStock.map((p) => String(p._id));
  const deletableIds = ids.filter((id) => !idsWithStock.includes(String(id)));

  if (deletableIds.length > 0) {
    await Product.updateMany({ _id: { $in: deletableIds } }, { $set: { removed: true } });
  }

  if (idsWithStock.length > 0 && deletableIds.length === 0) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Selected products have active inventory stock and cannot be deleted. Adjust stock to zero first.',
    });
  }

  if (idsWithStock.length > 0) {
    return res.status(200).json({
      success: true,
      result: { deletedCount: deletableIds.length, skippedCount: idsWithStock.length },
      message: `Deleted ${deletableIds.length} products. Skipped ${idsWithStock.length} product(s) with active stock.`,
    });
  }

  return res.status(200).json({
    success: true,
    result: { deletedCount: deletableIds.length },
    message: `Successfully deleted ${deletableIds.length} products`,
  });
};

methods.adjustStock = async (req, res) => {
  const { productId, quantity, direction, note = '' } = req.body;
  const amount = Number(quantity);
  if (!mongoose.Types.ObjectId.isValid(productId) || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, result: null, message: 'Invalid stock adjustment' });
  }
  if (!['in', 'out'].includes(direction)) {
    return res.status(400).json({ success: false, result: null, message: 'Direction must be in or out' });
  }
  const adjustmentNote = String(note || '').trim();

  try {
    const result = await applyStockMovement({
      productId,
      delta: direction === 'in' ? amount : -amount,
      type: 'adjustment',
      referenceType: 'manual',
      note: adjustmentNote,
      reason: adjustmentNote,
      createdBy: req.admin._id,
    });
    await mongoose.model('AuditLog').create({
      user: req.admin._id,
      action: 'inventory.adjust',
      entity: 'Product',
      entityId: productId,
      reason: adjustmentNote,
      changes: { direction, quantity: amount },
    });
    return res.status(200).json({
      success: true,
      result,
      message: 'Stock adjusted successfully',
    });
  } catch (error) {
    const status = /Insufficient|inventory tracking is disabled/i.test(error.message) ? 409 : 404;
    return res.status(status).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

methods.stockMovements = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, result: null, message: 'Invalid product id' });
  }
  const result = await StockMovement.find({ product: req.params.id })
    .sort({ created: -1 })
    .limit(100)
    .lean();
  return res.status(200).json({ success: true, result });
};

module.exports = methods;

