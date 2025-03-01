//form_model
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Option schema for choice-based questions
const optionSchema = new Schema(
  {
    // Removed explicit id field - will use MongoDB's auto-generated _id
    value: String,
    title: String,
    imageUrl: String
  },
  { _id: true } // This already ensures MongoDB creates _id fields
);

// Question schema
const questionSchema = new Schema({
  // Removed explicit id field - will use MongoDB's auto-generated _id
  title: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'Short Answer',
      'Paragraph',
      'Multiple Choice',
      'Checkbox',
      'Dropdown',
      'File Upload',
      'Linear Scale',
      'Date',
      'Time'
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

// Form schema
const formSchema = new Schema(
  {
    // MongoDB will automatically generate _id for each form
    title: { type: String, required: true, trim: true },
    description: String,
    isPublished: { type: Boolean, default: false },
    settings: {
      signInRequired: { type: Boolean, default: false },
      confirmationMessage: { type: String, default: 'Your response has been recorded.' },
      allowMultipleResponses: { type: Boolean, default: false },
      closesAt: Date,
      acceptingResponses: { type: Boolean, default: true }
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
