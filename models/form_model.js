const mongoose = require('mongoose');
const { Schema } = mongoose;

// Option schema for choice-based questions (if you're using this)
const optionSchema = new Schema({
  value: String,
  text: String,
  imageUrl: String
});

// Question schema
const questionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  description: String,
  type: {
    type: String,
    required: true,
    enum: [
      'short_answer',
      'paragraph',
      'multiple_choice',
      'checkbox',
      'dropdown',
      'file-upload',
      'linear_scale',
      'date',
      'time'
    ]
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
    maxFileSize: Number
  },
  metadata: {
    position: Number,
    visibilityLogic: {
      dependsOn: String,
      condition: String,
      value: Schema.Types.Mixed
    }
  }
});

// no need to save ID of author as there will only be 1 user managing the forms
// Form schema
const formSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    // Removed author field as there will only be 1 user managing the forms
    isPublished: { type: Boolean, default: false },
    settings: {
      signInRequired: { type: Boolean, default: false },
      confirmationMessage: { type: String, default: 'Your response has been recorded.' },
      allowMultipleResponses: { type: Boolean, default: false },
      closesAt: Date, // Date when the form will no longer accept responses
      acceptingResponses: { type: Boolean, default: true } // Whether the form is currently accepting responses
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
