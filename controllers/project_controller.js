const Project = require('../models/project_model');

// const isFullyApproved = doc.isApproved.byExecutiveDirector.approved; //check if the project is fully approved

// 1. Create a new project
exports.createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      isActivated: true,
      isApproved: {
        byRepresentative: false,
        byDean: false,
        byGeneralAccountingSupervisor: false,
        byComexCoordinator: false,
        byAcademicServicesDirector: false,
        byAcademicDirector: false,
        byExecutiveDirector: false
      }
    };

    const project = new Project(projectData);
    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Read operations
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isActivated: true });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectsByProgram = async (req, res) => {
  try {
    const projects = await Project.find({
      programId: req.params.programId,
      isActivated: true
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getApprovedProjectsByProgram = async (req, res) => {
  try {
    const projects = await Project.find({
      programId: req.params.programId,
      isActivated: true,
      'isApproved.byRepresentative': true,
      'isApproved.byDean': true,
      'isApproved.byGeneralAccountingSupervisor': true,
      'isApproved.byComexCoordinator': true,
      'isApproved.byAcademicServicesDirector': true,
      'isApproved.byAcademicDirector': true,
      'isApproved.byExecutiveDirector': true
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingProjectsByProgram = async (req, res) => {
  try {
    const projects = await Project.find({
      programId: req.params.programId,
      isActivated: true,
      $or: [
        { 'isApproved.byRepresentative': false },
        { 'isApproved.byDean': false },
        { 'isApproved.byGeneralAccountingSupervisor': false },
        { 'isApproved.byComexCoordinator': false },
        { 'isApproved.byAcademicServicesDirector': false },
        { 'isApproved.byAcademicDirector': false },
        { 'isApproved.byExecutiveDirector': false }
      ]
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeactivatedProjectsByProgram = async (req, res) => {
  try {
    const projects = await Project.find({
      programId: req.params.programId,
      isActivated: false
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getApprovedProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      isActivated: true,
      'isApproved.byRepresentative': true,
      'isApproved.byDean': true,
      'isApproved.byGeneralAccountingSupervisor': true,
      'isApproved.byComexCoordinator': true,
      'isApproved.byAcademicServicesDirector': true,
      'isApproved.byAcademicDirector': true,
      'isApproved.byExecutiveDirector': true
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      isActivated: true,
      $or: [
        { 'isApproved.byRepresentative': false },
        { 'isApproved.byDean': false },
        { 'isApproved.byGeneralAccountingSupervisor': false },
        { 'isApproved.byComexCoordinator': false },
        { 'isApproved.byAcademicServicesDirector': false },
        { 'isApproved.byAcademicDirector': false },
        { 'isApproved.byExecutiveDirector': false }
      ]
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeactivatedProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isActivated: false });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Update operations
exports.updateProject = async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approval functions
exports.approveProjectByRepresentative = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 'isApproved.byRepresentative': true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByDean = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 'isApproved.byDean': true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByGeneralAccountingSupervisor = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 'isApproved.byGeneralAccountingSupervisor': true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByComexCoordinator = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 'isApproved.byComexCoordinator': true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByAcademicServicesDirector = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 'isApproved.byAcademicServicesDirector': true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByAcademicDirector = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 'isApproved.byAcademicDirector': true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByExecutiveDirector = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 'isApproved.byExecutiveDirector': true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Soft-delete operations
exports.deactivateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActivated: false },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.restoreProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActivated: true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get projects where user is in workplan but hasn't signed
exports.getPendingWorkplanApprovals = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find projects where:
    // 1. Project is active
    // 2. User is in the workPlan array (by espUserId)
    // 3. The signature field is not present or null for that user's entry
    const projects = await Project.find({
      isActivated: true,
      workPlan: {
        $elemMatch: {
          espUserId: userId,
          $or: [{ signature: { $exists: false } }, { signature: null }]
        }
      }
    });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get projects where user is in workplan and has already signed
exports.getSignedWorkplanApprovals = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find projects where:
    // 1. Project is active
    // 2. User is in the workPlan array (by espUserId)
    // 3. The signature field exists and is not null for that user's entry
    const projects = await Project.find({
      isActivated: true,
      workPlan: {
        $elemMatch: {
          espUserId: userId,
          signature: { $exists: true, $ne: null }
        }
      }
    });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add workplan signature
exports.signWorkplanEntry = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.params.userId;
    const { signature } = req.body;

    if (!signature) {
      return res.status(400).json({ message: 'Signature is required' });
    }

    // Find the project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the user's entry in the workPlan
    const workPlanEntry = project.workPlan.find(entry => entry.espUserId === userId);

    if (!workPlanEntry) {
      return res.status(404).json({ message: 'User not found in work plan' });
    }

    // Update the signature and signedAt
    workPlanEntry.signature = signature;
    workPlanEntry.signedAt = new Date();

    // Save the project
    await project.save();

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
