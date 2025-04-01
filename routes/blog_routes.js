// routes/blog_routes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog_controller');
const authMiddleware = require('../middlewares/auth_middleware');

// Middleware to protect routes
const { requireAuth } = authMiddleware;

/**
 * @route GET /api/blogs
 * @desc Get all published blogs with pagination, filtering and search
 * @access Public
 */
router.get('/', blogController.getAllBlogs);

/**
 * @route GET /api/blogs/:blogId
 * @desc Get a single blog by ID
 * @access Public for published blogs, Private for unpublished (owner only)
 */
router.get('/:blogId', requireAuth, blogController.getBlogById);

/**
 * @route POST /api/blogs
 * @desc Create a new blog
 * @access Private
 */
router.post('/', requireAuth, blogController.uploadThumbnail, blogController.createBlog);

/**
 * @route PUT /api/blogs/:blogId
 * @desc Update a blog
 * @access Private (owner only)
 */
router.put('/:blogId', requireAuth, blogController.uploadThumbnail, blogController.updateBlog);

/**
 * @route DELETE /api/blogs/:blogId
 * @desc Soft delete a blog
 * @access Private (owner only)
 */
router.delete('/:blogId', requireAuth, blogController.deleteBlog);

/**
 * @route POST /api/blogs/:blogId/gallery
 * @desc Upload gallery images (up to 5)
 * @access Private (owner only)
 */
router.post(
  '/:blogId/gallery',
  requireAuth,
  blogController.uploadGalleryImages,
  blogController.uploadGallery
);

/**
 * @route DELETE /api/blogs/:blogId/gallery
 * @desc Remove a gallery image
 * @access Private (owner only)
 */
router.delete('/:blogId/gallery', requireAuth, blogController.removeGalleryImage);

/**
 * @route POST /api/blogs/:blogId/like
 * @desc Like or unlike a blog
 * @access Private
 */
router.post('/:blogId/like', requireAuth, blogController.toggleLikeBlog);

/**
 * @route POST /api/blogs/:blogId/comments
 * @desc Add a comment to a blog
 * @access Private
 */
router.post('/:blogId/comments', requireAuth, blogController.addComment);

/**
 * @route DELETE /api/blogs/:blogId/comments/:commentId
 * @desc Delete (soft) a comment
 * @access Private (comment owner or blog owner)
 */
router.delete('/:blogId/comments/:commentId', requireAuth, blogController.deleteComment);

/**
 * @route POST /api/blogs/:blogId/comments/:commentId/like
 * @desc Like or unlike a comment
 * @access Private
 */
router.post('/:blogId/comments/:commentId/like', requireAuth, blogController.toggleLikeComment);

/**
 * @route GET /api/blogs/user/:userId?
 * @desc Get blogs by user ID (or current user if no ID provided)
 * @access Private for own unpublished blogs, Public for others' published blogs
 */
router.get('/user/:userId?', requireAuth, blogController.getUserBlogs);

module.exports = router;
