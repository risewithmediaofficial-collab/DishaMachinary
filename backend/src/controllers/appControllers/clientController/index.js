const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const summary = require('./summary');

function modelController() {
  const Model = mongoose.model('Client');
  const methods = createCRUDController('Client');

  methods.create = async (req, res) => {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').replace(/\D/g, '');
    if (!name) {
      return res.status(400).json({ success: false, result: null, message: 'Customer name is required' });
    }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, result: null, message: 'Enter a valid 10-digit Indian mobile number' });
    }
    if (phone) {
      const duplicate = await Model.findOne({ phone, removed: false }).select('_id name phone').lean();
      if (duplicate) {
        return res.status(409).json({
          success: false,
          result: duplicate,
          message: `A customer with mobile ${phone} already exists`,
        });
      }
    }
    const result = await Model.create({
      ...req.body,
      name,
      phone,
      removed: false,
      createdBy: req.admin._id,
    });
    return res.status(200).json({ success: true, result, message: 'Customer added successfully' });
  };

  methods.summary = (req, res) => summary(Model, req, res);
  return methods;
}

module.exports = modelController();
