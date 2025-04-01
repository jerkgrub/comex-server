const mongoose = require('mongoose');

// Comment schema for blog posts
const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isActivated: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Main blog schema
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    thumbnailUrl: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    galleryImages: {
      type: [String],
      validate: [arrayLimit, '{PATH} exceeds the limit of 5']
    },
    tags: [String],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    comments: [commentSchema],
    isPublished: {
      type: Boolean,
      default: false
    },
    isActivated: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Validator for maximum gallery images
function arrayLimit(val) {
  return val.length <= 5;
}

// Text indexes for search functionality
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
