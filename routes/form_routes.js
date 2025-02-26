const express = require('express');
const router = express.Router();
const formController = require('../controllers/form_controller');
// Removed auth middleware for testing stage

// Form CRUD routes
router.post('/', formController.createForm);
router.get('/', formController.getAllForms);
router.get('/:formId', formController.getFormById);
router.put('/:formId', formController.updateForm);
router.delete('/:formId', formController.deleteForm);

// Form submission routes
router.post('/:formId/submit', formController.submitForm);
router.get('/:formId/submissions', formController.getFormSubmissions);
router.get('/submissions/:submissionId', formController.getSubmissionById);

// Analytics & Reporting routes
router.get('/:formId/analytics', formController.getFormAnalytics);
router.get('/:formId/export', formController.exportFormData);

// Form utilities
router.post('/:formId/duplicate', formController.duplicateForm);

module.exports = router;