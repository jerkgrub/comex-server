// models/credit_model.js
const mongoose = require('mongoose');

const CreditSchema = new mongoose.Schema({
  type: String, // "Institutional" "College-Driven" "Extension Services" "Capacity Building"
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  projectId: String, // Keep this for backward compatibility
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: false
  },
  response: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Response'
  },
  hours: {
    type: Number,
    required: true
  },
  description: String,
  awardedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['project', 'form', 'manual'],
    default: 'form'
  }
});

CreditSchema.index({ user: 1 });
CreditSchema.index({ user: 1, project: 1 }, { sparse: true });

const Credit = mongoose.model('Credit', CreditSchema);
module.exports = Credit;
