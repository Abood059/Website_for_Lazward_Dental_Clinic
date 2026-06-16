const CaseOrder = require('../models/CaseOrder.model');
const Product = require('../models/Product.model');
const fs = require('fs');
const path = require('path');

const createCase = async (clinicId, caseData) => {
  const { productId, notes } = caseData;

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const newCase = await CaseOrder.create({
    clinicId,
    productId,
    notes,
    status: 'draft'
  });

  return newCase;
};

const getCases = async (user) => {
  let query = {};
  if (user.role === 'clinic') {
    query.clinicId = user._id;
  }
  // Labtech and Admin can see all cases

  return await CaseOrder.find(query).populate('productId', 'name').populate('clinicId', 'clinicName email').sort({ createdAt: -1 });
};

const getCaseById = async (id, user) => {
  const caseOrder = await CaseOrder.findById(id).populate('productId').populate('clinicId', 'clinicName email firstName lastName phone');
  
  if (!caseOrder) {
    throw new Error('Case not found');
  }

  if (user.role === 'clinic' && caseOrder.clinicId._id.toString() !== user._id.toString()) {
    throw new Error('Not authorized to view this case');
  }

  return caseOrder;
};

const updateCase = async (id, user, data) => {
  const caseOrder = await CaseOrder.findById(id);

  if (!caseOrder) {
    throw new Error('Case not found');
  }

  if (user.role === 'clinic' && caseOrder.clinicId.toString() !== user._id.toString()) {
    throw new Error('Not authorized to update this case');
  }

  if (user.role === 'clinic' && caseOrder.status !== 'draft') {
    throw new Error('Cannot update case unless it is in draft status');
  }

  if (data.notes !== undefined) {
    caseOrder.notes = data.notes;
  }
  
  await caseOrder.save();
  return caseOrder;
};

const uploadFiles = async (id, user, fileUrls) => {
  const caseOrder = await CaseOrder.findById(id);

  if (!caseOrder) {
    throw new Error('Case not found');
  }

  if (user.role === 'clinic' && caseOrder.clinicId.toString() !== user._id.toString()) {
    throw new Error('Not authorized to upload files for this case');
  }

  // Allow uploading files in draft status
  if (user.role === 'clinic' && caseOrder.status !== 'draft') {
     throw new Error('Cannot upload files unless the case is in draft status');
  }

  caseOrder.files.push(...fileUrls);
  await caseOrder.save();
  return caseOrder;
};

const updateStatus = async (id, user, status) => {
  const caseOrder = await CaseOrder.findById(id);

  if (!caseOrder) {
    throw new Error('Case not found');
  }

  // Clinic can only change from draft to review
  if (user.role === 'clinic') {
     if (status !== 'review') {
        throw new Error('Clinic can only submit case for review');
     }
     if (caseOrder.status !== 'draft') {
        throw new Error('Case is already submitted');
     }
  }

  caseOrder.status = status;
  await caseOrder.save();
  return caseOrder;
};

const approveDesign = async (id, user) => {
  const caseOrder = await CaseOrder.findById(id);

  if (!caseOrder) {
    throw new Error('Case not found');
  }

  if (caseOrder.clinicId.toString() !== user._id.toString()) {
    throw new Error('Not authorized to approve this case');
  }

  if (caseOrder.status !== 'design') {
    throw new Error('Case is not in design status');
  }

  caseOrder.status = 'approved';
  caseOrder.designApprovedAt = Date.now();
  await caseOrder.save();
  return caseOrder;
};

const deleteCase = async (id, user) => {
  const caseOrder = await CaseOrder.findById(id);

  if (!caseOrder) {
    throw new Error('Case not found');
  }

  if (user.role === 'clinic' && caseOrder.clinicId.toString() !== user._id.toString()) {
    throw new Error('Not authorized to delete this case');
  }

  if (caseOrder.status !== 'draft') {
    throw new Error('Can only delete cases in draft status');
  }

  const caseId = caseOrder._id.toString();
  const dirPath = path.join(__dirname, '..', 'uploads', 'cases', caseId);

  fs.rm(dirPath, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error('Failed to delete case files:', err);
    }
  });

  await caseOrder.deleteOne();
  return true;
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  uploadFiles,
  updateStatus,
  approveDesign,
  deleteCase
};
