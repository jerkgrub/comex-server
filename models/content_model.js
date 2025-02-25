const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    about: {
      description: { type: String },
      mission: { type: String },
      vision: { type: String },
      mobileNumber: { type: String },
      email: { type: String },
      coordinatorName: { type: String },
      coordinatorAvatar: { type: String }
    },
    hero: {
      tagline: { type: String },
      description: { type: String },
      caption: { type: String }
    }
  },
  { timestamps: true }
);

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
