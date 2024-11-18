const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project_controller');

// 1. Create a new project
router.post('/new', projectController.createProject);

// 2. Fetch all approved projects
router.get('/approved/all', projectController.getApprovedProjects);

// 3. Fetch all unapproved projects
router.get('/unapproved/all', projectController.getUnapprovedProjects);

// 4. Fetch all projects
router.get('/all', projectController.getAllProjects);

// 5. Approve a project
router.put('/approve/:id', projectController.approveProject);

module.exports = router;
