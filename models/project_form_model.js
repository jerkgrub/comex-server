// models/project_form_model.js
const mongoose = require('mongoose');

const ProjectFormSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true
  },
  formType: {
    type: String,
    enum: ['registration', 'evaluation', 'feedback', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, { timestamps: true });

// Prevent duplicate form links
ProjectFormSchema.index(
  { projectId: 1, formId: 1, formType: 1 },
  { unique: true }
);

module.exports = mongoose.model('ProjectForm', ProjectFormSchema);