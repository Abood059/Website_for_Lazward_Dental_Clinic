const mongoose = require('mongoose');

const CaseOrderSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'design', 'approved', 'manufacturing', 'shipped', 'delivered'],
    default: 'draft'
  },
  notes: {
    type: String
  },
  files: [{
    type: String // URLs of uploaded files
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  designApprovedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt field on every save
CaseOrderSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('CaseOrder', CaseOrderSchema);
