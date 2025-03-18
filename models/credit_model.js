// models/credit_model.js
const mongoose = require('mongoose');

const CreditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: false
  },
  activityForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityForm',
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
    enum: ['activity', 'form', 'manual'],
    default: 'form'
  }
});

CreditSchema.index({ user: 1 });
CreditSchema.index({ user: 1, activity: 1 }, { sparse: true });

const Credit = mongoose.model('Credit', CreditSchema);
module.exports = Credit;
