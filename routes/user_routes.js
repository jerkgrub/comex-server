// routes/user_routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const { isAuthenticated } = require('../middlewares/auth'); // Import the authentication middleware

// Public Routes (No Authentication Required)
router.post('/login', userController.login);
router.post('/users/new', userController.newAcc);

// Protected Routes (Authentication Required)
router.get('/users/approved', isAuthenticated, userController.getApprovedUsers);
router.get('/users/pending', isAuthenticated, userController.getPendingUsers);
router.get('/users/deactivated', userController.getDeactivatedUsers);
router.put('/users/approve/:id', isAuthenticated, userController.approveUser);
router.get('/users/all', userController.findAllUser);
router.get('/users/search', isAuthenticated, userController.searchUsers);
router.get('/users/:id', isAuthenticated, userController.findOneUser);
router.get('/users/email/:email', userController.findOneUserByEmail);
router.put('/users/update/:id', isAuthenticated, userController.updateUser);

// New routes for user activation management
router.put('/users/deactivate/:id', userController.deactivateUser);
router.put('/users/restore/:id', userController.restoreUser);

router.delete('/users/delete/:id', isAuthenticated, userController.deleteUser);
router.post('/reset-password', userController.resetPassword);
router.put(
  '/users/upload-avatar/:id',
  userController.upload.single('avatar'),
  userController.uploadAvatar
);
router.put(
  '/users/upload-signature/:id',
  userController.upload.single('signature'),
  userController.uploadSignature
);

module.exports = router;
