// routes/user_routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const auth = require('../middlewares/auth'); // Import the authentication middleware

// Public Routes (No Authentication Required)
router.post('/login', userController.login);
router.post('/users/new', userController.newAcc);

// Protected Routes (Authentication Required)
router.get('/users/all', auth, userController.findAllUser);
router.get('/users/:id', auth, userController.findOneUser);
router.get('/users/email/:email', auth, userController.findOneUserByEmail);
router.put('/users/update/:id', auth, userController.updateUser);
router.delete('/users/delete/:id', auth, userController.deleteUser);
router.post('/reset-password', userController.resetPassword);
router.put('/users/upload-avatar/:id', userController.upload.single('avatar'), userController.uploadAvatar);


module.exports = router;
