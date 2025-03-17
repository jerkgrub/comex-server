// models/form_model.js
const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  value: String,
  title: String,
  imageUrl: String
}, { _id: true });

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String,
    required: true,
    enum: [
      'Short Answer', 'Paragraph', 'Multiple Choice', 
      'Checkbox', 'Dropdown', 'File Upload', 
      'Linear Scale', 'Date', 'Time'
    ]
  },
  isRequired: { type: Boolean, default: false },
  options: [optionSchema],
  validation: {
    minValue: Number,
    maxValue: Number,
    minLength: Number,
    maxLength: Number,
    regex: String,
    fileTypes: [String],
    maxFileSize: Number
  },
  linearScale: {
    minValue: { type: Number, default: 0 },
    maxValue: { type: Number, default: 5 },
    minLabel: String,
    maxLabel: String
  },
  metadata: {
    position: Number,
    visibilityLogic: {
      dependsOn: String,
      condition: String,
      value: mongoose.Schema.Types.Mixed
    }
  }
});

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  isPublished: { type: Boolean, default: false },
  category: {  // New field for filtering
    type: String,
    enum: ['INSTITUTIONAL', 'DEPARTMENTAL', 'GENERAL'],
    default: 'GENERAL'
  },
  settings: {
    signInRequired: { type: Boolean, default: false },
    confirmationMessage: { type: String, default: 'Your response has been recorded.' },
    allowMultipleResponses: { type: Boolean, default: false },
    closesAt: Date,
    maxResponses: { type: Number, default: 0 },
    acceptingResponses: { type: Boolean, default: true }
  },
  questions: [questionSchema],
  tags: [String],
  folder: String
}, { timestamps: true });

formSchema.index({ title: 'text', description: 'text' });
formSchema.index({ isPublished: 1 });

const Form = mongoose.model('Form', formSchema);
module.exports = Form;