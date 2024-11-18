const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project_controller');

// Route: Create a new project
router.post('/new', projectController.createProject);

// Route: Get all approved projects
router.get('/approved/all', projectController.getApprovedProjects);

// Route: Get all unapproved projects
router.get('/unapproved/all', projectController.getUnapprovedProjects);

module.exports = router;
