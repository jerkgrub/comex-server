const Blog = require('../models/blog_model');
const { put } = require('@vercel/blob');
const multer = require('multer');
const mongoose = require('mongoose');

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware to handle single file upload for thumbnail
const uploadThumbnail = upload.single('thumbnail');

// Middleware to handle multiple file uploads for gallery images
const uploadGalleryImages = upload.array('galleryImages', 5); // Max 5 images

// Helper function to upload file to Vercel Blob
const uploadFileToBlob = async (fileBuffer, fileName, fileType) => {
  try {
    const timestamp = Date.now();
    const uniqueFileName = `blog-uploads/${timestamp}-${fileName.replace(/\s+/g, '_')}`;

    console.log('Uploading to Vercel Blob:', {
      path: uniqueFileName,
      contentType: fileType,
      bufferSize: fileBuffer.length
    });

    const { url } = await put(uniqueFileName, fileBuffer, {
      access: 'public',
      contentType: fileType
    });

    console.log('Successfully uploaded to Vercel Blob, URL:', url);
    return url;
  } catch (error) {
    console.error('Error uploading file to Vercel Blob:', error);
    throw error;
  }
};

// Blog CRUD Operations
const createBlog = async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Thumbnail image is required' });
    }

    // Upload thumbnail to Vercel Blob
    const thumbnailUrl = await uploadFileToBlob(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const newBlog = new Blog({
      title,
      content,
      tags,
      userId,
      thumbnailUrl,
      galleryImages: [],
      isPublished: false,
      isActivated: true
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog post', error: error.message });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const { limit = 10, page = 1, tag, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = { isActivated: true, isPublished: true };

    // Add tag filter if provided
    if (tag) {
      query.tags = tag;
    }

    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const blogs = await Blog.find(query)
      .populate('userId', 'name profileImage')
      .select('-comments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Blog.countDocuments(query);

    // Return blogs with pagination metadata
    res.status(200).json({
      blogs,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error: error.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      _id: req.params.blogId,
      isActivated: true
    })
      .populate('userId', 'name profileImage')
      .populate('comments.userId', 'name profileImage');

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // If blog is not published, only the owner can view it
    if (!blog.isPublished && blog.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this blog post' });
    }

    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { title, content, tags, isPublished } = req.body;

    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if user is the owner of the blog
    if (blog.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to update this blog post' });
    }

    // Update fields if provided
    if (title) blog.title = title;
    if (content) blog.content = content;
    if (tags) blog.tags = tags;
    if (isPublished !== undefined) blog.isPublished = isPublished;

    // If thumbnail uploaded, update it
    if (req.file) {
      const thumbnailUrl = await uploadFileToBlob(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      blog.thumbnailUrl = thumbnailUrl;
    }

    await blog.save();
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog post', error: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if user is the owner of the blog
    if (blog.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to delete this blog post' });
    }

    // Soft delete
    blog.isActivated = false;
    await blog.save();

    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog post', error: error.message });
  }
};

// Upload gallery images
const uploadGallery = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if user is the owner of the blog
    if (blog.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to update this blog post' });
    }

    // Check if upload limit will be exceeded
    if (blog.galleryImages.length + req.files.length > 5) {
      return res.status(400).json({ message: 'Maximum gallery size is 5 images' });
    }

    // Upload each gallery image to Vercel Blob
    const uploadPromises = req.files.map(file =>
      uploadFileToBlob(file.buffer, file.originalname, file.mimetype)
    );

    const imageUrls = await Promise.all(uploadPromises);

    // Add new images to gallery
    blog.galleryImages = [...blog.galleryImages, ...imageUrls];
    await blog.save();

    res.status(200).json({ galleryImages: blog.galleryImages });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading gallery images', error: error.message });
  }
};

// Remove a gallery image
const removeGalleryImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if user is the owner of the blog
    if (blog.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to update this blog post' });
    }

    // Remove the image from gallery
    blog.galleryImages = blog.galleryImages.filter(url => url !== imageUrl);
    await blog.save();

    res.status(200).json({ galleryImages: blog.galleryImages });
  } catch (error) {
    res.status(500).json({ message: 'Error removing gallery image', error: error.message });
  }
};

// Like or unlike a blog
const toggleLikeBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      _id: req.params.blogId,
      isActivated: true,
      isPublished: true
    });

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const userId = req.user.id;
    const userLikedIndex = blog.likes.indexOf(userId);

    // Toggle like
    if (userLikedIndex === -1) {
      // User hasn't liked the blog yet, add like
      blog.likes.push(userId);
    } else {
      // User already liked the blog, remove like
      blog.likes.splice(userLikedIndex, 1);
    }

    await blog.save();

    res.status(200).json({
      likes: blog.likes.length,
      isLiked: userLikedIndex === -1
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
};

// Add a comment
const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const blog = await Blog.findOne({
      _id: req.params.blogId,
      isActivated: true,
      isPublished: true
    });

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Create new comment
    const newComment = {
      userId: req.user.id,
      content,
      likes: [],
      isActivated: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    blog.comments.push(newComment);
    await blog.save();

    // Get the newly added comment with populated user data
    const populatedBlog = await Blog.findById(req.params.blogId).populate(
      'comments.userId',
      'name profileImage'
    );

    const addedComment = populatedBlog.comments[populatedBlog.comments.length - 1];

    res.status(201).json(addedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const comment = blog.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Allow comment deletion for comment owner or blog owner
    if (comment.userId.toString() !== req.user.id && blog.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this comment' });
    }

    // Soft delete
    comment.isActivated = false;
    await blog.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Like or unlike a comment
const toggleLikeComment = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      _id: req.params.blogId,
      isActivated: true,
      isPublished: true
    });

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const comment = blog.comments.id(req.params.commentId);

    if (!comment || !comment.isActivated) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user.id;
    const userLikedIndex = comment.likes.indexOf(userId);

    // Toggle like
    if (userLikedIndex === -1) {
      // User hasn't liked the comment yet, add like
      comment.likes.push(userId);
    } else {
      // User already liked the comment, remove like
      comment.likes.splice(userLikedIndex, 1);
    }

    await blog.save();

    res.status(200).json({
      likes: comment.likes.length,
      isLiked: userLikedIndex === -1
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling comment like', error: error.message });
  }
};

// Get blogs by user
const getUserBlogs = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // If requesting own blogs, show all (including unpublished)
    // If requesting other user's blogs, only show published ones
    const isOwnBlogs = userId === req.user.id;

    const query = {
      userId,
      isActivated: true,
      ...(isOwnBlogs ? {} : { isPublished: true })
    };

    const blogs = await Blog.find(query)
      .populate('userId', 'name profileImage')
      .select('-comments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      blogs,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user blogs', error: error.message });
  }
};

module.exports = {
  uploadThumbnail,
  uploadGalleryImages,
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  uploadGallery,
  removeGalleryImage,
  toggleLikeBlog,
  addComment,
  deleteComment,
  toggleLikeComment,
  getUserBlogs
};
