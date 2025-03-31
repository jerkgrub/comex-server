const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project_controller');
const Project = require('../models/project_model');

// 1. Create
router.post('/new', projectController.createProject);

// 2. Read (keep in mind, that you should only fetch projects that have an isActivated value of true)
router.get('/', projectController.getAllProjects);
router.get('/deactivated', projectController.getDeactivatedProjects); // for here, only fetch projects that have an isActivated value of false
router.get('/approved/', projectController.getApprovedProjects); //get all projects that have an isApproved that have all trues
router.get('/pending/', projectController.getPendingProjects); // get all projects that have an isApproved that have at least one false

// program specific
router.get('/program/:programId', projectController.getProjectsByProgram); //get projects under specific program
router.get('/program/approved/:programId', projectController.getApprovedProjectsByProgram); //get all projects that have an isApproved that have all trues under specific program
router.get('/program/pending/:programId', projectController.getPendingProjectsByProgram); // get all projects that have an isApproved that have at least one false under specific program
router.get('/program/deactivated/:programId', projectController.getDeactivatedProjectsByProgram); // for here, only fetch projects that have an isActivated value of false under specific program

// Work plan approvals
router.get('/workplan/pending/:userId', projectController.getPendingWorkplanApprovals); // Get projects where user is in workplan but hasn't signed
router.get('/workplan/signed/:userId', projectController.getSignedWorkplanApprovals); // Get projects where user has already signed
router.post('/workplan/sign/:projectId/:userId', projectController.signWorkplanEntry); // Add signature to workplan entry

router.get('/:id', projectController.getProjectById); // get a single project by id

// 3. Update
router.put('/:id', projectController.updateProject);
// Approval system (basically just setting their respective isApproved field to true)
router.put('/approve/by-representative/:id', projectController.approveProjectByRepresentative);
router.put('/approve/by-dean/:id', projectController.approveProjectByDean);
router.put('/approve/by-comex-coordinator/:id', projectController.approveProjectByComexCoordinator);
router.put(
  '/approve/by-general-accounting-supervisor/:id',
  projectController.approveProjectByGeneralAccountingSupervisor
);
router.put(
  '/approve/by-academic-services-director/:id',
  projectController.approveProjectByAcademicServicesDirector
);
router.put('/approve/by-academic-director/:id', projectController.approveProjectByAcademicDirector);
router.put(
  '/approve/by-executive-director/:id',
  projectController.approveProjectByExecutiveDirector
);

// 4. Soft-delete a project
router.put('/deactivate/:id', projectController.deactivateProject);
router.put('/restore/:id', projectController.restoreProject);

module.exports = router;
