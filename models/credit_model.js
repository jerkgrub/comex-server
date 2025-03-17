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
    required: true
  },
  activityForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityForm',
    required: true
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
  }
});

CreditSchema.index({ user: 1, activity: 1 });

const Credit = mongoose.model('Credit', CreditSchema);
module.exports = Credit;