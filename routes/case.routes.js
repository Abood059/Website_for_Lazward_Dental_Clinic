const express = require('express');
const caseController = require('../controllers/case.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { uploadCaseFiles } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createCaseSchema, updateCaseStatusSchema } = require('../validations/case.validation');

const router = express.Router();

router.use(protect); // All case routes require authentication

router.route('/')
  .get(caseController.getCases)
  .post(restrictTo('clinic'), validate(createCaseSchema), caseController.createCase);

router.route('/:id')
  .get(caseController.getCaseById)
  .put(restrictTo('clinic'), caseController.updateCase)
  .delete(restrictTo('clinic'), caseController.deleteCase);

// Upload files
router.post('/:id/files', restrictTo('clinic'), uploadCaseFiles.array('files', 10), caseController.uploadFiles);

// Submit case (draft -> review)
router.post('/:id/submit', restrictTo('clinic'), caseController.submitCase);

// Update status (labtech/admin)
router.put('/:id/status', restrictTo('labtech', 'admin'), validate(updateCaseStatusSchema), caseController.updateStatus);

// Approve design (clinic)
router.post('/:id/approve-design', restrictTo('clinic'), caseController.approveDesign);

module.exports = router;
