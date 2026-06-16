const Lead = require('../models/Lead.model');
const emailService = require('../utils/email.service');

const createLead = async (leadData) => {
  const lead = await Lead.create(leadData);

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const text = `عميل محتمل جديد:
الاسم: ${lead.firstName} ${lead.lastName}
البريد: ${lead.email}
الهاتف: ${lead.phone || '-'}
العيادة: ${lead.clinicName || '-'}
الدور: ${lead.roleInClinic || '-'}`;

      const html = `
        <h3>عميل محتمل جديد</h3>
        <ul>
          <li><strong>الاسم:</strong> ${lead.firstName} ${lead.lastName}</li>
          <li><strong>البريد:</strong> ${lead.email}</li>
          <li><strong>الهاتف:</strong> ${lead.phone || '-'}</li>
          <li><strong>العيادة:</strong> ${lead.clinicName || '-'}</li>
          <li><strong>الدور:</strong> ${lead.roleInClinic || '-'}</li>
        </ul>
      `;

      await emailService.sendEmail(adminEmail, 'عميل محتمل جديد – لازورد', text, html);
    }
  } catch (error) {
    console.error('Failed to send lead email notification:', error);
  }

  return lead;
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
