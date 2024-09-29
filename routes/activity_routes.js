const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity_controller');

// Activity routes

// 1. Create
router.post('/api/activity/new', activityController.newActivity);

// 2. Read
router.get('/api/activity/all', activityController.findAllActivity);
router.get('/api/activity/:id', activityController.findOneActivity);

// 3. Update
router.put('/api/activity/update/:id', activityController.updateActivity);

// 4. Delete
router.delete('/api/activity/delete/:id', activityController.deleteActivity);

// Respondents section

// Add respondent
router.post('/api/activity/add/respondent/:id', activityController.addRespondent);

// Get all respondents
router.get('/api/activity/get/respondents/:id', activityController.getAllRespondents);

// Remove respondent
router.delete('/api/activity/respondent/:activityId/:userId', activityController.removeRespondent);

module.exports = router;