// models/response_model.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  fileUrl: String
});

const responseSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true
    },
    projectForm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectForm',
      required: false
    },
    respondent: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String
    },
    answers: [answerSchema],
    metadata: {
      ipAddress: String,
      userAgent: String,
      timeSpent: Number,
      completionDate: {
        type: Date,
        default: Date.now
      }
    },
    projectId: String, //newly added
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending'
    },
    deniedReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

responseSchema.index({ form: 1 });
responseSchema.index({ 'respondent.email': 1, form: 1 });
responseSchema.index({ createdAt: -1 });

const Response = mongoose.model('Response', responseSchema);
module.exports = Response;
