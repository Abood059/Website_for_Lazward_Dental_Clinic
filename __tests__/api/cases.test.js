const CaseOrder = require('../../models/CaseOrder.model');
const Product = require('../../models/Product.model');
const User = require('../../models/User.model');
const bcrypt = require('bcrypt');

describe('Cases API Integration', () => {
  let product;
  let clinic;

  beforeEach(async () => {
    // Create a test product
    product = await Product.create({
      name: 'Crown',
      description: 'Dental Crown',
      basePrice: 100,
      deliveryDays: 5,
    });

    // Create a test clinic user
    const hashedPassword = await bcrypt.hash('password123', 10);
    clinic = await User.create({
      firstName: 'Test',
      lastName: 'Clinic',
      email: 'testclinic@example.com',
      passwordHash: hashedPassword,
      clinicName: 'Test Clinic',
      phone: '+1234567890',
      role: 'clinic'
    });
  });

  describe('Case Creation and Retrieval', () => {
    it('should create a case', async () => {
      const caseData = {
        clinicId: clinic._id,
        productId: product._id,
        notes: 'Test case',
        status: 'draft'
      };

      const newCase = await CaseOrder.create(caseData);
      expect(newCase).toBeDefined();
      expect(newCase.status).toBe('draft');
    });

    it('should retrieve cases for clinic', async () => {
      const caseData = {
        clinicId: clinic._id,
        productId: product._id,
        notes: 'Test case',
        status: 'draft'
      };

      await CaseOrder.create(caseData);
      const cases = await CaseOrder.find({ clinicId: clinic._id });
      expect(cases.length).toBeGreaterThan(0);
    });

    it('should update case notes', async () => {
      const caseData = {
        clinicId: clinic._id,
        productId: product._id,
        notes: 'Original notes',
      };

      const newCase = await CaseOrder.create(caseData);
      newCase.notes = 'Updated notes';
      const updatedCase = await newCase.save();

      expect(updatedCase.notes).toBe('Updated notes');
    });

    it('should delete a draft case', async () => {
      const caseData = {
        clinicId: clinic._id,
        productId: product._id,
        notes: 'Case to delete',
        status: 'draft'
      };

      const newCase = await CaseOrder.create(caseData);
      const caseId = newCase._id;

      await CaseOrder.findByIdAndDelete(caseId);
      const deleted = await CaseOrder.findById(caseId);
      expect(deleted).toBeNull();
    });
  });
});
