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

module.exports = router;
