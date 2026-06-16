const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User.model');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        clinicName: 'Test Clinic',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      // Token is set in HttpOnly cookie, not in response body
      expect(response.headers['set-cookie']).toBeDefined();

      // Check user was created
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          // Missing other required fields
        });

      expect(response.status).toBe(400);
    });
  });
});
