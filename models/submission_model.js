const mongoose = require('mongoose');
const { Schema } = mongoose;

const answerSchema = new Schema({
  questionId: { type: String, required: true },
  value: Schema.Types.Mixed, // Can store any type of answer
  fileUrl: String, // For file type questions
});

const submissionSchema = new Schema(
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
submissionSchema.index({ form: 1 }); // For fetching submissions of a form
submissionSchema.index({ 'respondent.email': 1, form: 1 }); // For finding respondent's submissions
submissionSchema.index({ createdAt: -1 }); // For sorting by submission date

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;