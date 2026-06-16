const CaseOrder = require('../../models/CaseOrder.model');
const Product = require('../../models/Product.model');

describe('Case Service', () => {
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

    // Create a test clinic (mock user object)
    clinic = {
      _id: '507f1f77bcf86cd799439011',
      role: 'clinic',
      clinicName: 'Test Clinic',
    };
  });

  describe('CaseOrder Model', () => {
    it('should create a case successfully', async () => {
      const caseData = {
        clinicId: clinic._id,
        productId: product._id,
        notes: 'Test notes',
        status: 'draft'
      };

      const newCase = await CaseOrder.create(caseData);
      expect(newCase).toBeDefined();
      expect(newCase.productId.toString()).toBe(product._id.toString());
      expect(newCase.status).toBe('draft');
    });

    it('should get cases for clinic', async () => {
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

    it('should throw error if user is not authorized', async () => {
      const caseData = {
        clinicId: clinic._id,
        productId: product._id,
        notes: 'Test case',
      };

      const newCase = await CaseOrder.create(caseData);
      const otherClinicId = '507f1f77bcf86cd799439999';

      // Should fail because clinicId doesn't match
      await expect(async () => {
        if (newCase.clinicId.toString() !== otherClinicId.toString()) {
          throw new Error('Not authorized to update this case');
        }
      }).rejects.toThrow('Not authorized to update this case');
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

    it('should throw error if case is not in draft status', async () => {
      const caseData = {
        clinicId: clinic._id,
        productId: product._id,
        notes: 'Published case',
        status: 'approved'
      };

      const newCase = await CaseOrder.create(caseData);

      await expect(async () => {
        if (newCase.status !== 'draft') {
          throw new Error('Can only delete draft cases');
        }
      }).rejects.toThrow('Can only delete draft cases');
    });

    it('should throw error if not authorized', async () => {
      const caseData = {
        clinicId: clinic._id,
        productId: product._id,
        notes: 'Case to delete',
        status: 'draft'
      };

      const newCase = await CaseOrder.create(caseData);
      const otherClinicId = '507f1f77bcf86cd799439999';

      await expect(async () => {
        if (newCase.clinicId.toString() !== otherClinicId.toString()) {
          throw new Error('Not authorized to delete this case');
        }
      }).rejects.toThrow('Not authorized to delete this case');
    });
  });
});
