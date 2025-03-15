const express = require('express');
const router = express.Router();
const formController = require('../controllers/form_controller');
const multer = require('multer');
const upload = multer(); // Configure multer for memory storage
// Removed auth middleware for testing stage

// Form CRUD routes
router.post('/', formController.createForm);
router.get('/', formController.getAllForms);
router.get('/:formId', formController.getFormById);
router.put('/:formId', formController.updateForm);
router.delete('/:formId', formController.deleteForm);

// Form response routes
router.post('/:formId/submit', formController.submitForm);
router.post('/:formId/submit-file', upload.single('file'), formController.submitFormFile);
router.get('/:formId/responses', formController.getFormResponses);
router.post('/:formId/publish', formController.publishForm);
router.get('/responses/:responseId', formController.getResponseById);

// Analytics & Reporting routes
router.get('/:formId/analytics', formController.getFormAnalytics);
router.get('/:formId/export', formController.exportFormData);

// Form utilities
router.post('/:formId/duplicate', formController.duplicateForm);

module.exports = router;
