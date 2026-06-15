const Lead = require('../models/Lead.model');

const createLead = async (leadData) => {
  return await Lead.create(leadData);
};

const getLeads = async (filter = {}) => {
  return await Lead.find(filter).sort({ createdAt: -1 });
};

const updateLeadStatus = async (id, contacted) => {
  const lead = await Lead.findByIdAndUpdate(id, { contacted }, { new: true });
  if (!lead) {
    throw new Error('Lead not found');
  }
  return lead;
};

module.exports = {
  createLead,
  getLeads,
  updateLeadStatus
};
