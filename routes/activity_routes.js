const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity_controller');
const Activity = require('../models/activity_model');

// Route to get activities where a user is a respondent
router.get('/joined-activities/:id', activityController.findJoinedActivities);
// Fetch activities with type: Institutional & College Driven
router.get('/highlights', activityController.findHighlights);
// universal (Instituional + College-Driven) CAUTION: only fetch activities that have an isActivated value of true
router.get('/approved', activityController.findApprovedActivities);
router.get('/pending', activityController.findPendingActivities);
router.get('/deactivated', activityController.getDeactivatedActivities);

// project-specific / 'College Driven' | CAUTION: only fetch activities that have an isActivated value of true
router.get('/project/:projectId', activityController.getActivitiesByProject);
router.get('/project/:projectId/pending', activityController.findPendingActivitiesByProject);
router.get('/project/:projectId/approved', activityController.findApprovedActivitiesByProject);
// CAUTION: only fetch activities that have an isActivated value of false
router.get('/project/:projectId/deactivated', activityController.getDeactivatedActivitiesByProject);

// institutional-specific | CAUTION: only fetch activities that have an isActivated value of true, and a type of 'Institutional'
router.get('/institutional', activityController.findInstitutionalActivities);
router.get('/institutional/pending', activityController.findPendingInstitutionalActivities);
router.get('/institutional/approved', activityController.findApprovedInstitutionalActivities);
router.get('/institutional/deactivated', activityController.getDeactivatedInstitutionalActivities);

// 1. Create
router.post('/new', activityController.newActivity); // Removed "/api/activity" prefix

// 2. Read
router.get('/all', activityController.findAllActivity); // "/all" for all activities
router.get('/:id', activityController.findOneActivity);

// 3. Update
router.put('/update/:id', activityController.updateActivity); // Removed "/api/activity" prefix

// 4. Delete
router.delete('/delete/:id', activityController.deleteActivity); // Removed "/api/activity" prefix

// Respondents section

// Add respondent
router.post('/add/respondent/:id', activityController.addRespondent); // Removed "/api/activity" prefix

// Get all respondents
router.get('/get/respondents/:id', activityController.getAllRespondents); // Removed "/api/activity" prefix

// Remove respondent
router.delete('/respondent/:activityId/:userId', activityController.removeRespondent); // Removed "/api/activity" prefix

// In your server-side routes (e.g., activityRoutes.js)
router.get('/pending/count', async (req, res) => {
  try {
    const count = await Activity.countDocuments({
      isApproved: false,
      isActivated: { $ne: false } // Only count activated activities
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching pending activities count:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// New endpoint: Fetch activities by project ID
router.get('/by-project/:projectId', activityController.getActivitiesByProject);

// Activity soft-deletion handling
router.put('/deactivate/:id', activityController.deactivateActivity);
router.put('/restore/:id', activityController.restoreActivity);

// Activity approval
router.put('/approve/:id', activityController.approveActivity);

// Activity-Form Linking Routes
router.post('/:activityId/link-form', activityController.linkFormToActivity);
router.get('/:activityId/forms', activityController.getActivityForms);
router.put('/activity-form/:linkId/approve', activityController.approveFormLink);
router.delete('/activity-form/:linkId', activityController.removeFormLink);

// Enhanced Approval Routes
router.get('/:activityId/pending-forms', activityController.getPendingForms);
router.get('/:activityId/approved-forms', activityController.getApprovedForms);

// Credit-related Routes
router.get('/:activityId/credits', activityController.getActivityCredits);

module.exports = router;
