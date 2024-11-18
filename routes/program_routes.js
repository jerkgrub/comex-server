const express = require('express');
const router = express.Router();
const programController = require('../controllers/program_controller');

// 1. Create a new program
router.post('/new', programController.createProgram);

// 2. Fetch all approved programs
router.get('/approved/all', programController.getApprovedPrograms);

// 3. Fetch all unapproved programs
router.get('/unapproved/all', programController.getUnapprovedPrograms);

// 4. Fetch all programs
router.get('/all', programController.getAllPrograms);

// 5. Approve a program
router.put('/approve/:id', programController.approveProgram);

module.exports = router;
