//response_model
const mongoose = require('mongoose');
const { Schema } = mongoose;

const answerSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, required: true },
  value: Schema.Types.Mixed, // Can store any type of answer
  fileUrl: String // For file type questions
});

const responseSchema = new Schema(
  {
    form: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    respondent: {
      email: String,
      name: String,
      userId: { type: Schema.Types.ObjectId, ref: 'User' } // Optional, if authenticated
    },
    answers: [answerSchema],
    metadata: {
      ipAddress: String,
      userAgent: String,
      timeSpent: Number, // Time spent filling the form in seconds
      completionDate: { type: Date, default: Date.now }
    },
    status: {
      type: String,
      enum: ['complete', 'partial'],
      default: 'complete'
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
responseSchema.index({ form: 1 }); // For fetching responses of a form
responseSchema.index({ 'respondent.email': 1, form: 1 }); // For finding respondent's responses
responseSchema.index({ createdAt: -1 }); // For sorting by response date

const Response = mongoose.model('Response', responseSchema);
module.exports = Response;
