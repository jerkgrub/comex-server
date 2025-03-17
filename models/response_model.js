// models/response_model.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  value: mongoose.Schema.Types.Mixed,
  fileUrl: String
});

const responseSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true
    },
    activityForm: {
      // New reference
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActivityForm'
    },
    respondent: {
      email: String,
      name: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    answers: [answerSchema],
    metadata: {
      ipAddress: String,
      userAgent: String,
      timeSpent: Number,
      completionDate: { type: Date, default: Date.now }
    },
    status: {
      type: String,
      enum: ['complete', 'partial', 'approved', 'denied', 'pending'],
      default: 'pending'
    },
    denialReason: String
  },
  { timestamps: true }
);

responseSchema.index({ form: 1 });
responseSchema.index({ 'respondent.email': 1, form: 1 });
responseSchema.index({ createdAt: -1 });

const Response = mongoose.model('Response', responseSchema);
module.exports = Response;
