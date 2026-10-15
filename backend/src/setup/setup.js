require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { globSync } = require('glob');
const fs = require('fs');
const { generate: uniqueId } = require('../utils/uniqueId');

const mongoose = require('mongoose');

async function setupApp() {
  try {
    const databaseUrl = process.env.DATABASE?.trim();
    if (!databaseUrl) {
      throw new Error('DATABASE is not set. Add your MongoDB connection URI to backend/.env.local.');
    }
    await mongoose.connect(databaseUrl);

    const Admin = require('../models/coreModels/Admin');
    const AdminPassword = require('../models/coreModels/AdminPassword');
    let admin = await Admin.findOne({ email: 'admin@admin.com' });
    if (!admin) {
      admin = await new Admin({
        email: 'admin@admin.com',
        name: 'Disha Machinary',
        surname: 'Admin',
        enabled: true,
        role: 'owner',
      }).save();
    }

    const existingPassword = await AdminPassword.findOne({ user: admin._id });
    if (!existingPassword) {
      const passwordModel = new AdminPassword();
      const salt = uniqueId();
      await new AdminPassword({
        password: passwordModel.generateHash(salt, 'admin123'),
        salt,
        user: admin._id,
      }).save();
    }

    console.log('Admin ready: admin@admin.com / admin123');

    const Product = require('../models/appModels/Product');
    const products = JSON.parse(fs.readFileSync('./src/setup/defaultProducts.json', 'utf-8'));
    await Product.bulkWrite(
      products.map(({ name, sku }) => ({
        updateOne: {
          filter: { sku },
          update: {
            $setOnInsert: {
              name,
              sku,
              createdBy: admin._id,
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
    console.log(`Product catalog ready: ${products.length} machine placeholders`);

    const Setting = require('../models/coreModels/Setting');

    const settingFiles = [];

    const settingsFiles = globSync('./src/setup/defaultSettings/**/*.json');

    for (const filePath of settingsFiles) {
      const file = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      settingFiles.push(...file);
    }

    if ((await Setting.countDocuments()) === 0) {
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

    console.log('🥳 Setup completed :Success!');
    await mongoose.disconnect();
  } catch (e) {
    console.error(`Setup failed: ${e.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  }
}

setupApp();
