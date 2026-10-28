const mongoose = require('mongoose');

const Model = mongoose.model('Setting');

const updateManySetting = async (req, res) => {
  // req.body can be { settings: [{ settingKey, settingValue }], settingCategory } or array of settings
  const rawSettings = Array.isArray(req.body)
    ? req.body
    : Array.isArray(req.body?.settings)
    ? req.body.settings
    : [];

  const explicitCategory = req.body?.settingCategory;

  if (rawSettings.length === 0) {
    return res.status(202).json({
      success: false,
      result: null,
      message: 'No settings provided',
    });
  }

  const updateDataArray = [];

  for (const setting of rawSettings) {
    if (!setting || typeof setting !== 'object') continue;
    const settingKey = String(setting.settingKey || setting.key || '').trim();
    if (!settingKey) continue;

    // Preserve boolean, number, string, or empty string. Default undefined/null to empty string.
    const settingValue =
      setting.settingValue !== undefined && setting.settingValue !== null
        ? setting.settingValue
        : '';

    // Infer category if not explicit
    let category = setting.settingCategory || explicitCategory;
    if (!category) {
      if (settingKey.startsWith('company_')) category = 'company_settings';
      else if (settingKey.startsWith('app_')) category = 'app_settings';
      else if (settingKey.startsWith('finance_')) category = 'finance_settings';
      else if (settingKey.startsWith('client_')) category = 'client_settings';
      else if (settingKey.startsWith('invoice_')) category = 'invoice_settings';
      else if (settingKey.startsWith('quote_')) category = 'quote_settings';
      else if (settingKey.startsWith('money_format_')) category = 'money_format_settings';
      else category = 'company_settings';
    }

    updateDataArray.push({
      updateOne: {
        filter: { settingKey: settingKey },
        update: {
          $set: {
            settingKey: settingKey,
            settingValue: settingValue,
          },
          $setOnInsert: {
            settingCategory: category,
            enabled: true,
            removed: false,
            isPrivate: false,
          },
        },
        upsert: true,
      },
    });
  }

  if (updateDataArray.length === 0) {
    return res.status(202).json({
      success: false,
      result: null,
      message: 'No valid settings provided',
    });
  }

  await Model.bulkWrite(updateDataArray);

  return res.status(200).json({
    success: true,
    result: [],
    message: 'Successfully updated all settings',
  });
};

module.exports = updateManySetting;
