const leadService = require('../services/lead.service');

exports.createLead = async (req, res, next) => {
  try {
    const lead = await leadService.createLead(req.body);
    res.status(201).json({ status: 'success', data: { lead } });
  } catch (error) {
    next(error);
  }
};

exports.getLeads = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.contacted !== undefined) {
      filter.contacted = req.query.contacted === 'true';
    }
    const leads = await leadService.getLeads(filter);
    res.status(200).json({ status: 'success', data: { leads } });
  } catch (error) {
    next(error);
  }
};

exports.updateLeadStatus = async (req, res, next) => {
  try {
    const lead = await leadService.updateLeadStatus(req.params.id, req.body.contacted);
    res.status(200).json({ status: 'success', data: { lead } });
  } catch (error) {
    if (error.message === 'Lead not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};
