// models/activity_form_model.js
const mongoose = require('mongoose');

const ActivityFormSchema = new mongoose.Schema({
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true
  },
  type: {
    type: String,
    enum: ['REGISTRATION', 'EVALUATION', 'SURVEY'],
    required: true
  },
  status: {
    approval: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },
  creditDetails: {
    hours: Number,
    description: String
  },
  autoApprove: { type: Boolean, default: false }
}, { timestamps: true });

ActivityFormSchema.index({ activity: 1, form: 1 });

const ActivityForm = mongoose.model('ActivityForm', ActivityFormSchema);
module.exports = ActivityForm;