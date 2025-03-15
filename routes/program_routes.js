const express = require('express');
const router = express.Router();
const programController = require('../controllers/program_controller');
const Program = require('../models/program_model');

// 1. Create
router.post('/new', programController.createProgram);

// 2. Read (keep in mind, that you should only fetch programs that have an isActivated value of true)
router.get('/', programController.getAllPrograms);
router.get('/deactivated', programController.getDeactivatedPrograms); // and finally, for here, only fetch programs that have an isActivated value of false

// department specific
router.get('/department/:department', programController.getProgramsByDepartment);
router.get('/department/approved/:department', programController.getApprovedProgramsByDepartment);
router.get('/department/pending/:department', programController.getPendingProgramsByDepartment);
router.get('/department/deactivated/:department', programController.getDeactivatedProgramsByDepartment);

// universal
router.get('/approved/', programController.getApprovedPrograms); //get all programs that have an isApproved that have all trues
router.get('/pending/', programController.getPendingPrograms); // get all programs that have an isApproved that have at least one false
router.get('/:id', programController.getProgramById); // get a single program by id


// 3. Update
router.put('/:id', programController.updateProgram);
// Approval system (basically just setting their respective isApproved field to true)
router.put('/approve/by-representative/:id', programController.approveProgramByRepresentative);
router.put('/approve/by-dean/:id', programController.approveProgramByDean);
router.put('/approve/by-general-accounting-supervisor/:id', programController.approveProgramByGeneralAccountingSupervisor);
router.put('/approve/by-comex-coordinator/:id', programController.approveProgramByComexCoordinator);
router.put('/approve/by-academic-services-director/:id', programController.approveProgramByAcademicServicesDirector);
router.put('/approve/by-academic-director/:id', programController.approveProgramByAcademicDirector);
router.put('/approve/by-executive-director/:id', programController.approveProgramByExecutiveDirector);

// 4. Soft-delete a program
router.put('/deactivate/:id', programController.deactivateProgram);
router.put('/restore/:id', programController.restoreProgram);

module.exports = router;
