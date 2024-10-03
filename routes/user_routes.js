const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');

// Auth
router.post('/login', userController.login);  // Removed '/api' prefix

// 1. Create
router.post('/users/new', userController.newAcc);  // Removed '/api' prefix

// 2. Read
router.get('/users/all', userController.findAllUser);  // Removed '/api' prefix
router.get('/users/:id', userController.findOneUser);  // Removed '/api' prefix
router.get('/users/email/:email', userController.findOneUserByEmail);  // Removed '/api' prefix

// 3. Update
router.put('/users/update/:id', userController.updateUser);  // Removed '/api' prefix

// 4. Delete
router.delete('/users/delete/:id', userController.deleteUser);  // Removed '/api' prefix

module.exports = router;
