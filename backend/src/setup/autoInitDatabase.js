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
    const productCount = await Product.countDocuments({ removed: false });
    if (productCount === 0) {
      const defaultProductsPath = './src/setup/defaultProducts.json';
      if (fs.existsSync(defaultProductsPath)) {
        const products = JSON.parse(fs.readFileSync(defaultProductsPath, 'utf-8'));
        const defaultAdmin = await Admin.findOne({ email: 'admin@admin.com' });
        if (defaultAdmin && products.length > 0) {
          await Product.bulkWrite(
            products.map(({ name, sku }) => ({
              updateOne: {
                filter: { sku },
                update: {
                  $setOnInsert: {
                    name,
                    sku,
                    createdBy: defaultAdmin._id,
                    itemType: 'product',
                    unit: 'piece',
                    hsnCode: '',
                    description: '',
                    purchasePrice: 0,
                    sellingPrice: 0,
                    wholesalePrice: 0,
                    gstRate: 0,
                    stockQuantity: 0,
                    reorderLevel: 0,
                    trackInventory: true,
                    enabled: true,
                  },
                },
                upsert: true,
              },
            }))
          );
          console.log(`✅ Default product catalog populated (${products.length} items)`);
        }
      }
    }
  } catch (error) {
    console.error('⚠️ Auto-initialization warning:', error.message);
  }
}

module.exports = autoInitDatabase;
