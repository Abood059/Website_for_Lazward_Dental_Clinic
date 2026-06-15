const Joi = require('joi');

const createCaseSchema = Joi.object({
  productId: Joi.string().required(),
  notes: Joi.string().allow('', null)
});

const updateCaseStatusSchema = Joi.object({
  status: Joi.string().valid('review', 'design', 'approved', 'manufacturing', 'shipped', 'delivered').required()
});

module.exports = {
  createCaseSchema,
  updateCaseStatusSchema
};
