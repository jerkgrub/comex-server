const express = require('express');
const router = express.Router();
const creditController = require('../controllers/credit_controller');

// Award credits
router.post('/award', creditController.awardCreditFromResponse);

// Get credits
router.get('/user/:userId', creditController.getUserCredits);
router.get('/project/:projectId', creditController.getProjectCredits);
router.get('/:id', creditController.getCreditById);

// Update and delete credits
router.put('/:id', creditController.updateCredit);
router.delete('/:id', creditController.deleteCredit);

// Response-related credits (these are still implemented in the controller)
router.get('/response/:responseId', creditController.getResponseCredits);
router.post('/create', creditController.createCreditManually);
router.get('/users/:userId/response/:responseId', creditController.getUserResponseCredits);

module.exports = router;
