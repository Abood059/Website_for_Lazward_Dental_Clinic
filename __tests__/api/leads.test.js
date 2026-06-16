const request = require('supertest');
const app = require('../../app');
const Lead = require('../../models/Lead.model');
const emailService = require('../../utils/email.service');

// Mock email service
jest.mock('../../utils/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Leads API', () => {
  describe('POST /api/leads', () => {
    it('should create a lead', async () => {
      const leadData = {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed@example.com',
        phone: '+970123456789',
        clinicName: 'Smile Clinic',
        roleInClinic: 'Doctor',
      };

      const response = await request(app)
        .post('/api/leads')
        .send(leadData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.lead.email).toBe('ahmed@example.com');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/leads')
        .send({
          firstName: 'Test',
          // Missing other required fields like email
        });

      expect(response.status).toBe(400);
    });

    it('should send admin notification email', async () => {
      process.env.ADMIN_EMAIL = 'admin@example.com';

      const leadData = {
        firstName: 'Test',
        lastName: 'Lead',
        email: 'testlead@example.com',
        phone: '+970555555555',
        clinicName: 'Test Clinic',
        roleInClinic: 'Manager',
      };

      await request(app)
        .post('/api/leads')
        .send(leadData);

      // Check if email was attempted to be sent
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'admin@example.com',
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
