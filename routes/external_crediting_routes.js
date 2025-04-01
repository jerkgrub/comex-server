const express = require('express');
const router = express.Router();
const externalCreditingController = require('../controllers/external_crediting_controller');
const { isAuthenticated, isAuthorized } = require('../middlewares/auth');

// Debug middleware to log token and user info
const logRequestInfo = (req, res, next) => {
  console.log('External crediting request received:', {
    path: req.path,
    method: req.method,
    hasAuthHeader: !!req.headers['authorization'],
    headerLength: req.headers['authorization'] ? req.headers['authorization'].length : 0,
    userId: req.user ? req.user.id || req.user._id : 'No user',
    userRole: req.user ? req.user.role || req.user.usertype : 'No role'
  });
  next();
};

// Link a form to a category
router.post(
  '/link',
  isAuthenticated,
  logRequestInfo, // Added logging middleware
  // We handle auth in the controller for better debugging
  externalCreditingController.linkForm
);

// Unlink a form from a category
router.delete(
  '/unlink/:category',
  isAuthenticated,
  isAuthorized(['Admin', 'ComEx Coordinator']),
  externalCreditingController.unlinkForm
);

// Get all linked forms
router.get('/forms', isAuthenticated, externalCreditingController.getLinkedForms);

// Get linked form for a specific category
router.get(
  '/forms/:category',
  isAuthenticated,
  externalCreditingController.getLinkedFormByCategory
);

// Get all form responses for a category
router.get(
  '/responses/:category',
  isAuthenticated,
  isAuthorized(['Admin', 'ComEx Coordinator']),
  externalCreditingController.getFormResponsesByCategory
);

// Approve or reject a form response for crediting
router.put(
  '/review/:responseId',
  isAuthenticated,
  isAuthorized(['Admin', 'ComEx Coordinator']),
  externalCreditingController.reviewFormResponse
);

module.exports = router;
