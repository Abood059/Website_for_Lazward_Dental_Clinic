const authService = require('../../services/auth.service');
const User = require('../../models/User.model');
const jwt = require('jsonwebtoken');

describe('Auth Service', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        clinicName: 'Dental Clinic',
        phone: '+1234567890'
      };

      const token = await authService.register(userData);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user.firstName).toBe('John');
      expect(user.role).toBe('clinic');
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
        clinicName: 'Another Clinic',
        phone: '+1234567890'
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow('Email already in use');
    });

    it('should hash password before saving', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'plainPassword123',
        clinicName: 'Test Clinic',
        phone: '+1234567890'
      };

      await authService.register(userData);
      const user = await User.findOne({ email: userData.email });

      expect(user.passwordHash).not.toBe('plainPassword123');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      const userData = {
        firstName: 'Login',
        lastName: 'Test',
        email: 'login@example.com',
        password: 'password123',
        clinicName: 'Login Clinic',
        phone: '+1234567890'
      };
      await authService.register(userData);
    });

    it('should login user with correct credentials', async () => {
      const token = await authService.login('login@example.com', 'password123');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify JWT token
      const decoded = jwt.decode(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBeDefined();
    });

    it('should throw error with incorrect email', async () => {
      await expect(authService.login('wrong@example.com', 'password123')).rejects.toThrow('Invalid email or password');
    });

    it('should throw error with incorrect password', async () => {
      await expect(authService.login('login@example.com', 'wrongPassword')).rejects.toThrow('Invalid email or password');
    });
  });
});
