const express = require('express');
const router = express.Router();
const creditController = require('../controllers/credit_controller');

// User Credit Routes
router.get('/users/:userId/credits', creditController.getUserCredits);
router.get('/:creditId', creditController.getCreditDetails);
router.delete('/:creditId', creditController.revokeCredit);

// Admin Credit Management
router.get('/activity/:activityId', creditController.getActivityCredits);
router.get('/form/:formId', creditController.getFormCredits);
router.get('/response/:responseId', creditController.getResponseCredits);
router.post('/create', creditController.createCreditManually);
router.get('/users/:userId/response/:responseId', creditController.getUserResponseCredits);

module.exports = router;
