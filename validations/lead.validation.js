const Joi = require('joi');

const createLeadSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null),
  clinicName: Joi.string().allow('', null),
  roleInClinic: Joi.string().allow('', null)
});

module.exports = {
  createLeadSchema
};
