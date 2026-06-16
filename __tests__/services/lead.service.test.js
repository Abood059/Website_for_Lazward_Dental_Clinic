const leadService = require('../../services/lead.service');
const Lead = require('../../models/Lead.model');
const emailService = require('../../utils/email.service');

// Mock emailService
jest.mock('../../utils/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Lead Service', () => {
  describe('createLead', () => {
    it('should create a lead successfully', async () => {
      const leadData = {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed@example.com',
        phone: '+970123456789',
        clinicName: 'Smile Clinic',
        roleInClinic: 'Doctor',
      };

      const lead = await leadService.createLead(leadData);
      expect(lead).toBeDefined();
      expect(lead.firstName).toBe('Ahmed');
      expect(lead.email).toBe('ahmed@example.com');

      const savedLead = await Lead.findById(lead._id);
      expect(savedLead).toBeDefined();
    });

    it('should send admin email notification when lead is created', async () => {
      process.env.ADMIN_EMAIL = 'admin@example.com';

      const leadData = {
        firstName: 'Mohamed',
        lastName: 'Ali',
        email: 'mohamed@example.com',
        phone: '+970987654321',
        clinicName: 'New Clinic',
        roleInClinic: 'Manager',
      };

      await leadService.createLead(leadData);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'admin@example.com',
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should not throw error if email sending fails', async () => {
      process.env.ADMIN_EMAIL = 'admin@example.com';
      emailService.sendEmail.mockRejectedValueOnce(new Error('Email send failed'));

      const leadData = {
        firstName: 'Test',
        lastName: 'Lead',
        email: 'test@example.com',
        phone: '+970555555555',
        clinicName: 'Test Clinic',
        roleInClinic: 'Owner',
      };

      // Should not throw
      const lead = await leadService.createLead(leadData);
      expect(lead).toBeDefined();
    });
  });

  describe('getLeads', () => {
    it('should fetch all leads', async () => {
      const leadData1 = {
        firstName: 'Lead1',
        lastName: 'Test1',
        email: 'lead1@example.com',
      };

      const leadData2 = {
        firstName: 'Lead2',
        lastName: 'Test2',
        email: 'lead2@example.com',
      };

      await Lead.create(leadData1);
      await Lead.create(leadData2);

      const leads = await leadService.getLeads();
      expect(leads.length).toBe(2);
    });
  });

  describe('updateLeadStatus', () => {
    it('should update lead contacted status', async () => {
      const leadData = {
        firstName: 'Update',
        lastName: 'Test',
        email: 'update@example.com',
        contacted: false,
      };

      const created = await Lead.create(leadData);
      const updated = await leadService.updateLeadStatus(created._id, true);

      expect(updated.contacted).toBe(true);
    });

    it('should throw error if lead not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await expect(leadService.updateLeadStatus(fakeId, true)).rejects.toThrow('Lead not found');
    });
  });
});
