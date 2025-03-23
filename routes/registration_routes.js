const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration_controller');

// Create registration from response
router.post('/fromResponse', registrationController.createRegistrationFromResponse);

// Get registrations
router.get('/', registrationController.getAllRegistrations);
router.get('/project/:projectId', registrationController.getRegistrationsByProject);
router.get('/user/:userId', registrationController.getRegistrationsByUser);

// Update registration
router.put('/:id', registrationController.updateRegistration);
router.put('/complete/:id', registrationController.completeRegistration);

// Delete registration
router.delete('/:id', registrationController.deleteRegistration);

module.exports = router;
