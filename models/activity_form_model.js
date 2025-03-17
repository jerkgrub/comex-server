// models/activity_form_model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activityFormSchema = new Schema(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: true
    },
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'Form',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Create a compound index to ensure uniqueness of activity-form pairs
activityFormSchema.index({ activityId: 1, formId: 1 }, { unique: true });

const ActivityForm = mongoose.model('ActivityForm', activityFormSchema);

module.exports = ActivityForm;
