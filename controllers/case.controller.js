const caseService = require('../services/case.service');

exports.createCase = async (req, res, next) => {
  try {
    const caseOrder = await caseService.createCase(req.user._id, req.body);
    res.status(201).json({ status: 'success', data: { caseOrder } });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.getCases = async (req, res, next) => {
  try {
    const cases = await caseService.getCases(req.user);
    res.status(200).json({ status: 'success', data: { cases } });
  } catch (error) {
    next(error);
  }
};

exports.getCaseById = async (req, res, next) => {
  try {
    const caseOrder = await caseService.getCaseById(req.params.id, req.user);
    res.status(200).json({ status: 'success', data: { caseOrder } });
  } catch (error) {
    if (['Case not found', 'Not authorized to view this case'].includes(error.message)) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.updateCase = async (req, res, next) => {
  try {
    const caseOrder = await caseService.updateCase(req.params.id, req.user, req.body);
    res.status(200).json({ status: 'success', data: { caseOrder } });
  } catch (error) {
    if (['Case not found', 'Not authorized to update this case', 'Cannot update case unless it is in draft status'].includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

exports.uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Convert file paths to URLs relative to the uploads folder
    const fileUrls = req.files.map(file => `/uploads/cases/${req.params.id || 'temp'}/${file.filename}`);

    // If we use temp id, we should handle it properly, but the middleware uses req.params.id.
    const caseOrder = await caseService.uploadFiles(req.params.id, req.user, fileUrls);
    res.status(200).json({ status: 'success', data: { caseOrder } });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('authorized') || error.message.includes('draft status')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const caseOrder = await caseService.updateStatus(req.params.id, req.user, req.body.status);
    res.status(200).json({ status: 'success', data: { caseOrder } });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('authorized') || error.message.includes('submit')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

exports.submitCase = async (req, res, next) => {
   try {
      const caseOrder = await caseService.updateStatus(req.params.id, req.user, 'review');
      res.status(200).json({ status: 'success', data: { caseOrder } });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('authorized') || error.message.includes('submit')) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
};

exports.approveDesign = async (req, res, next) => {
  try {
    const caseOrder = await caseService.approveDesign(req.params.id, req.user);
    res.status(200).json({ status: 'success', data: { caseOrder } });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('authorized') || error.message.includes('design status')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

exports.deleteCase = async (req, res, next) => {
  try {
    await caseService.deleteCase(req.params.id, req.user);
    res.status(200).json({ status: 'success', message: 'Case deleted successfully' });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('authorized') || error.message.includes('draft status')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};
