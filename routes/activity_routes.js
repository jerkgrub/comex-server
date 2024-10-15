const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity_controller');
const Activity = require('../models/activity_model');

// Activity routes

// 1. Create
router.post('/new', activityController.newActivity);  // Removed "/api/activity" prefix

// 2. Read
router.get('/all', activityController.findAllActivity);  // "/all" for all activities
router.get('/:id', activityController.findOneActivity);  // Removed "/api/activity" prefix

// 3. Update
router.put('/update/:id', activityController.updateActivity);  // Removed "/api/activity" prefix

// 4. Delete
router.delete('/delete/:id', activityController.deleteActivity);  // Removed "/api/activity" prefix

// Respondents section

// Add respondent
router.post('/add/respondent/:id', activityController.addRespondent);  // Removed "/api/activity" prefix

// Get all respondents
router.get('/get/respondents/:id', activityController.getAllRespondents);  // Removed "/api/activity" prefix

// Remove respondent
router.delete('/respondent/:activityId/:userId', activityController.removeRespondent);  // Removed "/api/activity" prefix

// In your server-side routes (e.g., activityRoutes.js)
router.get('/pending/count', async (req, res) => {
    try {
      const count = await Activity.countDocuments({
        'adminApproval.isApproved': false,
      });
      res.json({ count });
    } catch (error) {
      console.error('Error fetching pending activities count:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });  

module.exports = router;
