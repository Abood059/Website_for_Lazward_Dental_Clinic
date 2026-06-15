const express = require('express');
const leadController = require('../controllers/lead.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createLeadSchema } = require('../validations/lead.validation');

const router = express.Router();

router.route('/')
  .post(validate(createLeadSchema), leadController.createLead)
  .get(protect, restrictTo('admin'), leadController.getLeads);

router.route('/:id/contacted')
  .put(protect, restrictTo('admin'), leadController.updateLeadStatus);

module.exports = router;
