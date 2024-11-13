const express = require('express');
const router = express.Router();
const { createProgram, getApprovedPrograms, getUnapprovedPrograms } = require('../controllers/program_controller');

// Route to create a new program
router.post('/new', createProgram);

// Route to get all approved programs
router.get('/approved/all', getApprovedPrograms);

// Route to get all unapproved programs
router.get('/unapproved/all', getUnapprovedPrograms);

module.exports = router;
