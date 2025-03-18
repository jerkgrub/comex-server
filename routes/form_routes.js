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

// Form response routes
router.post('/:formId/submit', formController.submitForm);
router.get('/:formId/responses', formController.getFormResponses);
router.post('/:formId/publish', formController.publishForm);
router.get('/responses/:responseId', formController.getResponseById);

// Response approval routes
router.post('/responses/:responseId/approve', formController.approveResponse);
router.post('/responses/:responseId/deny', formController.denyResponse);
router.post('/responses/:responseId/revoke', formController.revokeResponse);

// File upload route
router.post('/upload-file', formController.handleFileUpload, formController.uploadFormFile);

// Analytics & Reporting routes
router.get('/:formId/analytics', formController.getFormAnalytics);
router.get('/:formId/export', formController.exportFormData);

// Form utilities
router.post('/:formId/duplicate', formController.duplicateForm);

// Form Categorization Routes
router.get('/category/:category', formController.getFormsByCategory);

// Form-Activity Linking Info
router.get('/:formId/linked-activities', formController.getFormActivities);

// Modified form submission route with activity context
router.post('/:formId/submit', formController.submitFormWithContext);

module.exports = router;
