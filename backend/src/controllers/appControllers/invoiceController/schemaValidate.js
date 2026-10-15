const Joi = require('joi');
const schema = Joi.object({
  client: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  number: Joi.number().required(),
  year: Joi.number().required(),
  status: Joi.string().valid('draft', 'pending', 'sent', 'posted', 'cancelled').required(),
  notes: Joi.string().allow(''),
  expiredDate: Joi.date().required(),
  date: Joi.date().required(),
  // array cannot be empty
  items: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().allow('').optional(),
        product: Joi.string().hex().length(24).optional(),
        itemName: Joi.string().allow('').optional(),
        description: Joi.string().allow(''),
        quantity: Joi.number().positive().required(),
        price: Joi.number().min(0).optional(),
        gstRate: Joi.number().min(0).max(100).optional(),
        total: Joi.number().optional(),
      }).required()
    )
    .required(),
  gstEnabled: Joi.boolean().default(false),
  taxRate: Joi.number().min(0).max(100).default(0),
  discount: Joi.number().min(0).default(0),
  currency: Joi.string().valid('INR').default('INR'),
});

module.exports = schema;
