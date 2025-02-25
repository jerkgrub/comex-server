// routes/content_routes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content_controller');

// Create new content
router.post('/', contentController.createContent);

// Get all content
router.get('/', contentController.getAllContent);

// Get content by ID
router.get('/:id', contentController.getContentById);

// Update content by ID
router.put('/:id', contentController.updateContent);

// Delete content by ID
router.delete('/:id', contentController.deleteContent);

module.exports = router;
