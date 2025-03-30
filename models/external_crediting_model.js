const mongoose = require('mongoose');

const ExternalCreditingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['capacity-building', 'extension-services']
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Ensure each category has only one active form
ExternalCreditingSchema.index(
  { category: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

module.exports = mongoose.model('ExternalCrediting', ExternalCreditingSchema);
