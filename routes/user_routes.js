const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');

// insert routes here

// Auth
router.post('/api/login', userController.login);

// 1. Create
router.post('/api/users/new', userController.newAcc);

// 2. Read
router.get('/api/users/all', userController.findAllUser);
router.get('/api/users/:id', userController.findOneUser);
router.get('/api/users/email/:email', userController.findOneUserByEmail);

// 3. Update
router.put('/api/users/update/:id', userController.updateUser);

// 4. Delete
router.delete('/api/users/delete/:id', userController.deleteUser); //DELETE

module.exports = router;