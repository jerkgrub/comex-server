const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    response: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Response'
    },
    role: {
      type: String,
      default: 'Participant'
    },
    hoursToRender: {
      type: Number,
      default: 0
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active'
    }
  },
  { timestamps: true }
);

// Prevent duplicate registrations
RegistrationSchema.index({ user: 1, project: 1 }, { unique: true });

const Registration = mongoose.model('Registration', RegistrationSchema);
module.exports = Registration;
