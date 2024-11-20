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

router.get('/pending/count', async (req, res) => {
    try {
        const count = await Project.countDocuments({ isApproved: false });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching pending projects count:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});



module.exports = router;
