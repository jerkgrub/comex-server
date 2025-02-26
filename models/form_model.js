const mongoose = require('mongoose');
const { Schema } = mongoose;

// Option schema for choice-based questions (if you're using this)
const optionSchema = new Schema({
  value: String,
  text: String,
  imageUrl: String,
});

// Question schema
const questionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  description: String,
  type: {
    type: String,
    required: true,
    enum: ['short_text', 'long_text', 'number', 'single_choice', 'multiple_choice', 
           'dropdown', 'date', 'time', 'file', 'scale', 'linear_scale', 'grid']
  },
  isRequired: { type: Boolean, default: false },
  options: [optionSchema], // For choice-based questions
  validation: {
    minValue: Number,
    maxValue: Number,
    minLength: Number,
    maxLength: Number,
    regex: String,
    fileTypes: [String],
    maxFileSize: Number,
  },
  metadata: {
    position: Number,
    visibilityLogic: {
      dependsOn: String,
      condition: String,
      value: Schema.Types.Mixed,
    }
  }
});

// Form schema
const formSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    // Removed author field
    isPublished: { type: Boolean, default: false },
    settings: {
      collectEmail: { type: Boolean, default: false },
      confirmationMessage: { type: String, default: 'Your response has been recorded.' },
      allowMultipleResponses: { type: Boolean, default: false },
      showProgressBar: { type: Boolean, default: true },
      shuffleQuestions: { type: Boolean, default: false },
      theme: { type: String, default: 'default' },
      expiresAt: Date,
    },
    questions: [questionSchema],
    tags: [String],
    folder: String
  },
  { timestamps: true }
);

// Indexes for better query performance
formSchema.index({ title: 'text', description: 'text' });
formSchema.index({ isPublished: 1 });

const Form = mongoose.model('Form', formSchema);
module.exports = Form;