const Content = require('../models/content_model');
const { put } = require('@vercel/blob');
const multer = require('multer');

// Set up Multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Create new content
const createContent = async (req, res) => {
  try {
    const { about, hero } = req.body;

    const newContent = new Content({
      about,
      hero
    });

    const savedContent = await newContent.save();
    res.status(201).json({
      message: 'Content created successfully',
      content: savedContent
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({
      message: 'Error creating content',
      error: error.message
    });
  }
};

// Get all content
const getAllContent = async (req, res) => {
  try {
    const content = await Content.find().sort({ createdAt: -1 });
    res.status(200).json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// Get content by ID
const getContentById = async (req, res) => {
  try {
    const contentId = req.params.id;
    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.status(200).json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// Update content by ID
const updateContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const updateData = req.body;

    const updatedContent = await Content.findByIdAndUpdate(contentId, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedContent) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.status(200).json({
      message: 'Content updated successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      message: 'Error updating content',
      error: error.message
    });
  }
};

// Upload hero background image
const uploadHeroBackground = async (req, res) => {
  const imageFile = req.file; // Multer provides the file as req.file
  const contentId = req.params.id;

  if (!imageFile) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Upload the image to Vercel Blob
    const { url } = await put(`hero-backgrounds/${contentId}-${Date.now()}.png`, imageFile.buffer, {
      access: 'public'
    });

    // Update MongoDB with the new image URL
    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Update the hero backgroundImage property
    if (!content.hero) {
      content.hero = { backgroundImage: url };
    } else {
      content.hero.backgroundImage = url;
    }

    await content.save();

    res.status(200).json({
      message: 'Hero background image uploaded successfully',
      backgroundImageUrl: url,
      content
    });
  } catch (error) {
    console.error('Error uploading hero background image:', error);
    res.status(500).json({ message: 'Error uploading hero background image', error });
  }
};

// Delete content by ID
const deleteContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const deletedContent = await Content.findByIdAndDelete(contentId);

    if (!deletedContent) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.status(200).json({
      message: 'Content deleted successfully',
      content: deletedContent
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      message: 'Error deleting content',
      error: error.message
    });
  }
};

module.exports = {
  createContent,
  getAllContent,
  getContentById,
  updateContent,
  deleteContent,
  uploadHeroBackground,
  upload
};
