const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { generate: uniqueId } = require('../utils/uniqueId');
const mongoose = require('mongoose');

async function autoInitDatabase() {
  try {
    const Admin = require('../models/coreModels/Admin');
    const AdminPassword = require('../models/coreModels/AdminPassword');
    const Setting = require('../models/coreModels/Setting');
    const Product = require('../models/appModels/Product');

    const adminCount = await Admin.countDocuments({ removed: false });
    if (adminCount === 0) {
      console.log('⚡ Initializing default Admin account for Disha Machinary...');
      const admin = await new Admin({
        email: 'admin@admin.com',
        name: 'Disha Machinary',
        surname: 'Admin',
        enabled: true,
        role: 'owner',
      }).save();

      const passwordModel = new AdminPassword();
      const salt = uniqueId();
      await new AdminPassword({
        password: passwordModel.generateHash(salt, 'admin123'),
        salt,
        user: admin._id,
      }).save();

      console.log('✅ Default Admin created: admin@admin.com / admin123');
    }

    const settingCount = await Setting.countDocuments({ removed: false });
    if (settingCount === 0) {
      console.log('⚡ Initializing default application settings...');
      const settingsFiles = globSync('./src/setup/defaultSettings/**/*.json');
      const settingFiles = [];
      for (const filePath of settingsFiles) {
        const file = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        settingFiles.push(...file);
      }
      if (settingFiles.length > 0) {
        await Setting.insertMany(settingFiles);
      }

      const indiaMoneySettings = {
        default_currency_code: 'INR',
        currency_name: 'Indian Rupee',
        currency_symbol: '₹',
        currency_position: 'before',
        thousand_sep: ',',
        decimal_sep: '.',
        cent_precision: 2,
      };
      await Promise.all(
        Object.entries(indiaMoneySettings).map(([settingKey, settingValue]) =>
          Setting.updateOne(
            { settingKey },
            {
              $set: { settingValue, settingCategory: 'money_format_settings', removed: false },
              $setOnInsert: { valueType: typeof settingValue },
            },
            { upsert: true }
          )
        )
      );
      await Setting.updateOne(
        { settingKey: 'idurar_app_timezone' },
        {
          $set: { settingValue: 'Asia/Kolkata', settingCategory: 'app_settings', removed: false },
          $setOnInsert: { valueType: 'string' },
        },
        { upsert: true }
      );
      console.log('✅ Default settings configured (INR, Asia/Kolkata)');
    }

    // Seed default products if empty
    const defaultProductsPath = './src/setup/defaultProducts.json';
    const defaultProductsList = fs.existsSync(defaultProductsPath)
      ? JSON.parse(fs.readFileSync(defaultProductsPath, 'utf-8'))
      : [];

    const defaultAdmin = await Admin.findOne({ email: 'admin@admin.com' });
    const productCount = await Product.countDocuments({ removed: false });

    if (productCount === 0 && defaultAdmin && defaultProductsList.length > 0) {
      await Product.bulkWrite(
        defaultProductsList.map((item) => ({
          updateOne: {
            filter: { sku: item.sku },
            update: {
              $setOnInsert: {
                name: item.name,
                sku: item.sku,
                createdBy: defaultAdmin._id,
                itemType: 'product',
                unit: 'piece',
                hsnCode: '8479',
                description: item.name,
                purchasePrice: item.purchasePrice || 25000,
                sellingPrice: item.sellingPrice || 35000,
                wholesalePrice: item.purchasePrice ? item.purchasePrice * 1.15 : 28000,
                gstRate: item.gstRate || 18,
                stockQuantity: item.stockQuantity || 50,
                reorderLevel: 5,
                trackInventory: true,
                enabled: true,
              },
            },
            upsert: true,
          },
        }))
      );
      console.log(`✅ Default product catalog populated (${defaultProductsList.length} items with 50 stock)`);
    }

    // Ensure ALL existing non-service products in the database have 50 stock for billing
    const StockMovement = mongoose.model('StockMovement');
    const adminId = defaultAdmin?._id || new mongoose.Types.ObjectId();
    const productPriceMap = new Map(defaultProductsList.map((p) => [p.sku, p]));

    const existingProducts = await Product.find({ removed: false });
    let updatedStockCount = 0;

    for (const prod of existingProducts) {
      if (prod.itemType === 'service') continue;

      const previousStock = Number(prod.stockQuantity || 0);
      let modified = false;

      // Always set stock to 50 as requested for billing
      if (prod.stockQuantity !== 50) {
        prod.stockQuantity = 50;
        modified = true;
      }
      if (!prod.trackInventory) {
        prod.trackInventory = true;
        modified = true;
      }
      if (!prod.enabled) {
        prod.enabled = true;
        modified = true;
      }

      const defaultMeta = productPriceMap.get(prod.sku);
      if ((!prod.sellingPrice || prod.sellingPrice === 0) && defaultMeta?.sellingPrice) {
        prod.sellingPrice = defaultMeta.sellingPrice;
        modified = true;
      }
      if ((!prod.purchasePrice || prod.purchasePrice === 0) && defaultMeta?.purchasePrice) {
        prod.purchasePrice = defaultMeta.purchasePrice;
        modified = true;
      }
      if ((!prod.gstRate || prod.gstRate === 0) && (defaultMeta?.gstRate || 18)) {
        prod.gstRate = defaultMeta?.gstRate || 18;
        modified = true;
      }

      if (modified) {
        await prod.save();
        updatedStockCount++;

        if (previousStock !== 50) {
          try {
            await StockMovement.create({
              product: prod._id,
              productName: prod.name,
              sku: prod.sku,
              type: 'adjustment',
              quantity: Math.abs(50 - previousStock),
              delta: 50 - previousStock,
              stockBefore: previousStock,
              stockAfter: 50,
              referenceType: 'manual',
              note: 'Initialized to 50 stock for POS billing',
              reason: 'POS billing stock availability',
              createdBy: adminId,
            });
          } catch (smError) {
            // ignore non-critical stock movement logging error
          }
        }
      }
    }

    if (updatedStockCount > 0) {
      console.log(`✅ Ensured stock quantity = 50 for ${updatedStockCount} products for billing`);
    }
  } catch (error) {
    console.error('⚠️ Auto-initialization warning:', error.message);
  }
}

module.exports = autoInitDatabase;
