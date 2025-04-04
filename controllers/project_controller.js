const Project = require('../models/project_model');
const User = require('../models/user_model');
const { notifyProjectCreatorAboutWorkplanSigning, notifyProjectCreatorAboutApproval, notifyUserAboutWorkplanAssignment } = require('./notification_controller');
const { put } = require('@vercel/blob');
const multer = require('multer');

// const isFullyApproved = doc.isApproved.byExecutiveDirector.approved; //check if the project is fully approved

// 1. Create a new project
exports.createProject = async (req, res) => {
  try {
    // Ensure additionalInfo is properly formatted to match schema
    if (req.body.additionalInfo && Array.isArray(req.body.additionalInfo)) {
      req.body.additionalInfo = req.body.additionalInfo.map(item => ({
        id: item.id || '',
        type: item.type || 'content',
        value: item.value || ''
      }));
    }

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
    console.error('Error creating project:', error);
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
      'isApproved.byRepresentative.approved': true,
      'isApproved.byDean.approved': true,
      'isApproved.byComexCoordinator.approved': true,
      'isApproved.byGeneralAccountingSupervisor.approved': true,
      'isApproved.byAcademicServicesDirector.approved': true,
      'isApproved.byAcademicDirector.approved': true,
      'isApproved.byExecutiveDirector.approved': true
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
        { 'isApproved.byRepresentative.approved': false },
        { 'isApproved.byDean.approved': false },
        { 'isApproved.byComexCoordinator.approved': false },
        { 'isApproved.byGeneralAccountingSupervisor.approved': false },
        { 'isApproved.byAcademicServicesDirector.approved': false },
        { 'isApproved.byAcademicDirector.approved': false },
        { 'isApproved.byExecutiveDirector.approved': false }
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
      'isApproved.byRepresentative.approved': true,
      'isApproved.byDean.approved': true,
      'isApproved.byComexCoordinator.approved': true,
      'isApproved.byGeneralAccountingSupervisor.approved': true,
      'isApproved.byAcademicServicesDirector.approved': true,
      'isApproved.byAcademicDirector.approved': true,
      'isApproved.byExecutiveDirector.approved': true
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
        { 'isApproved.byRepresentative.approved': false },
        { 'isApproved.byDean.approved': false },
        { 'isApproved.byComexCoordinator.approved': false },
        { 'isApproved.byGeneralAccountingSupervisor.approved': false },
        { 'isApproved.byAcademicServicesDirector.approved': false },
        { 'isApproved.byAcademicDirector.approved': false },
        { 'isApproved.byExecutiveDirector.approved': false }
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
    console.log('====== PROJECT UPDATE CONTROLLER DEBUGGER ======');
    console.log('Project ID:', req.params.id);
    console.log('Has _preserveSignatures flag:', !!req.body._preserveSignatures);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('WorkPlan items in request:', req.body.workPlan?.length || 0);

    // Store original project workplan to compare after update
    let originalWorkPlan = [];
    const originalProject = await Project.findById(req.params.id);
    if (originalProject && originalProject.workPlan) {
      originalWorkPlan = originalProject.workPlan.map(item => item.espUserId).filter(Boolean);
    }

    if (req.body.workPlan && req.body.workPlan.length > 0) {
      // Show a sample workplan item to check structure
      console.log('Sample workplan item (first item):', req.body.workPlan[0]);

      // Check if any workplan items already have signatures (should be none)
      const itemsWithSignatures = req.body.workPlan.filter(item => item.signature);
      console.log('Items with signatures in request (should be 0):', itemsWithSignatures.length);
    }

    let updatedProject;

    // Check if we should preserve signatures
    if (req.body._preserveSignatures) {
      console.log('Using custom updateWithSignaturePreservation method');

      try {
        // Use the custom method that preserves signatures
        updatedProject = await Project.updateWithSignaturePreservation(req.params.id, req.body);
        console.log('Successfully executed updateWithSignaturePreservation');
      } catch (error) {
        console.error('Error in updateWithSignaturePreservation:', error);
        // Fallback to regular update if custom method fails
        console.log('Falling back to standard update method');
        updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
      }
    } else {
      console.log('Using standard findByIdAndUpdate method');
      // Use the standard update method
      updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    }

    if (!updatedProject) {
      console.log('Project not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check the resulting workplan to see if any signatures were preserved
    if (updatedProject.workPlan && updatedProject.workPlan.length > 0) {
      const signedItems = updatedProject.workPlan.filter(item => item.signature);
      console.log('Items with signatures in result:', signedItems.length);
      if (signedItems.length > 0) {
        console.log('Signature preservation SUCCESS!');
        signedItems.forEach(item => {
          console.log('Preserved signature for:', {
            espName: item.espName,
            espUserId: item.espUserId,
            hasSignature: !!item.signature,
            signedAt: item.signedAt
          });
        });
      } else {
        console.log('WARNING: No signed items found after update!');
      }

      // Send notifications to users who were added to the workplan
      try {
        const newWorkPlanUsers = updatedProject.workPlan
          .filter(item => item.espUserId && !originalWorkPlan.includes(item.espUserId))
          .filter(item => !item.signature); // Only notify users who haven't already signed

        console.log(`Sending notifications to ${newWorkPlanUsers.length} new workplan users`);

        for (const workplanItem of newWorkPlanUsers) {
          await notifyUserAboutWorkplanAssignment(updatedProject, workplanItem);
        }

        // If the project is already approved by the Executive Director, automatically credit new workplan users
        if (updatedProject.isApproved.byExecutiveDirector.approved) {
          console.log('Project is already approved by the Executive Director - awarding credits to new workplan users');

          const Credit = require('../models/credit_model');
          let newCreditsCount = 0;

          // For each new user in the workplan
          for (const workplanItem of newWorkPlanUsers) {
            if (!workplanItem.espUserId) continue;

            try {
              // Check if credit already exists
              const existingCredit = await Credit.findOne({
                user: workplanItem.espUserId,
                project: updatedProject._id,
                source: 'project'
              });

              // Skip if credit already exists
              if (existingCredit) {
                console.log(`Credit already exists for user ${workplanItem.espUserId} in project ${updatedProject.title}`);
                continue;
              }

              // Create new credit
              const credit = new Credit({
                type: updatedProject.engagementType || 'College-Driven',
                user: workplanItem.espUserId,
                project: updatedProject._id,
                projectId: updatedProject._id.toString(),
                hours: workplanItem.hoursReceived || 0,
                description: `Credit for ${updatedProject.title} - Role: ${workplanItem.role || 'Participant'}`,
                source: 'project'
              });

              await credit.save();
              newCreditsCount++;
            } catch (err) {
              console.error(`Error creating credit for user ${workplanItem.espUserId}:`, err);
            }
          }

          console.log(`Created ${newCreditsCount} new credits for project ${updatedProject.title}`);
        }
      } catch (notificationError) {
        console.error('Error sending workplan assignment notifications:', notificationError);
        // Don't fail the update if notifications fail
      }
    }

    console.log('====== END PROJECT UPDATE CONTROLLER DEBUGGER ======');
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('ERROR updating project:', error);
    res.status(500).json({ message: error.message });
  }
};

// Approval functions
exports.approveProjectByRepresentative = async (req, res) => {
  try {
    // Get current user info (if any)
    const userId = req.user ? req.user._id : null;
    let approverName = 'Representative';

    if (req.user) {
      approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      if (!approverName) approverName = 'Representative';
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update approval data
    project.isApproved.byRepresentative.approved = true;
    project.isApproved.byRepresentative.approvedOn = new Date();
    project.isApproved.byRepresentative.approvedBy = userId;

    // Save changes
    await project.save();

    // Notify project creator
    await notifyProjectCreatorAboutApproval(project, 'byRepresentative', approverName);

    res.status(200).json(project);
  } catch (error) {
    console.error('Error approving project by representative:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByDean = async (req, res) => {
  try {
    // Get current user info (if any)
    const userId = req.user ? req.user._id : null;
    let approverName = 'Dean';

    if (req.user) {
      approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      if (!approverName) approverName = 'Dean';
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update approval data
    project.isApproved.byDean.approved = true;
    project.isApproved.byDean.approvedOn = new Date();
    project.isApproved.byDean.approvedBy = userId;

    // Save changes
    await project.save();

    // Notify project creator
    await notifyProjectCreatorAboutApproval(project, 'byDean', approverName);

    res.status(200).json(project);
  } catch (error) {
    console.error('Error approving project by dean:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByGeneralAccountingSupervisor = async (req, res) => {
  try {
    // Get current user info (if any)
    const userId = req.user ? req.user._id : null;
    let approverName = 'General Accounting Supervisor';

    if (req.user) {
      approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      if (!approverName) approverName = 'General Accounting Supervisor';
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update approval data
    project.isApproved.byGeneralAccountingSupervisor.approved = true;
    project.isApproved.byGeneralAccountingSupervisor.approvedOn = new Date();
    project.isApproved.byGeneralAccountingSupervisor.approvedBy = userId;

    // Save changes
    await project.save();

    // Notify project creator
    await notifyProjectCreatorAboutApproval(project, 'byGeneralAccountingSupervisor', approverName);

    res.status(200).json(project);
  } catch (error) {
    console.error('Error approving project by general accounting supervisor:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByComexCoordinator = async (req, res) => {
  try {
    // Get current user info (if any)
    const userId = req.user ? req.user._id : null;
    let approverName = 'ComEx Coordinator';

    if (req.user) {
      approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      if (!approverName) approverName = 'ComEx Coordinator';
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update approval data
    project.isApproved.byComexCoordinator.approved = true;
    project.isApproved.byComexCoordinator.approvedOn = new Date();
    project.isApproved.byComexCoordinator.approvedBy = userId;

    // Save changes
    await project.save();

    // Notify project creator
    await notifyProjectCreatorAboutApproval(project, 'byComexCoordinator', approverName);

    res.status(200).json(project);
  } catch (error) {
    console.error('Error approving project by ComEx coordinator:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByAcademicServicesDirector = async (req, res) => {
  try {
    // Get current user info (if any)
    const userId = req.user ? req.user._id : null;
    let approverName = 'Academic Services Director';

    if (req.user) {
      approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      if (!approverName) approverName = 'Academic Services Director';
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update approval data
    project.isApproved.byAcademicServicesDirector.approved = true;
    project.isApproved.byAcademicServicesDirector.approvedOn = new Date();
    project.isApproved.byAcademicServicesDirector.approvedBy = userId;

    // Save changes
    await project.save();

    // Notify project creator
    await notifyProjectCreatorAboutApproval(project, 'byAcademicServicesDirector', approverName);

    res.status(200).json(project);
  } catch (error) {
    console.error('Error approving project by academic services director:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.approveProjectByAcademicDirector = async (req, res) => {
  try {
    // Get current user info (if any)
    const userId = req.user ? req.user._id : null;
    let approverName = 'Academic Director';

    if (req.user) {
      approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      if (!approverName) approverName = 'Academic Director';
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update approval data
    project.isApproved.byAcademicDirector.approved = true;
    project.isApproved.byAcademicDirector.approvedOn = new Date();
    project.isApproved.byAcademicDirector.approvedBy = userId;

    // Save changes
    await project.save();

    // Notify project creator
    await notifyProjectCreatorAboutApproval(project, 'byAcademicDirector', approverName);

    res.status(200).json(project);
  } catch (error) {
    console.error('Error approving project by academic director:', error);
    res.status(500).json({ message: error.message });
  }
};

// Utility function to validate workPlan data
const validateWorkPlan = workPlan => {
  if (!workPlan || !Array.isArray(workPlan) || workPlan.length === 0) {
    console.log('WorkPlan is empty or invalid');
    return false;
  }

  let isValid = true;
  const mongoose = require('mongoose');

  // Check each workPlan item
  workPlan.forEach((item, index) => {
    console.log(`Validating workPlan item #${index + 1}:`, JSON.stringify(item));

    // Required fields
    if (!item.espUserId) {
      console.log(`  - Missing espUserId in workPlan item #${index + 1}`);
      isValid = false;
    } else if (!mongoose.Types.ObjectId.isValid(item.espUserId)) {
      console.log(`  - Invalid espUserId format in workPlan item #${index + 1}: ${item.espUserId}`);
      isValid = false;
    }

    if (!item.espName) {
      console.log(`  - Missing espName in workPlan item #${index + 1}`);
    }

    if (!item.activity) {
      console.log(`  - Missing activity in workPlan item #${index + 1}`);
    }

    if (!item.role) {
      console.log(`  - Missing role in workPlan item #${index + 1}`);
    }

    if (item.hoursReceived === undefined || item.hoursReceived === null) {
      console.log(`  - Missing hoursReceived in workPlan item #${index + 1}`);
    }
  });

  return isValid;
};

exports.approveProjectByExecutiveDirector = async (req, res) => {
  try {
    console.log('====== EXECUTIVE DIRECTOR APPROVAL - STARTED ======');

    // Get current user info (if any)
    const userId = req.user ? req.user._id : null;
    let approverName = 'Executive Director';

    if (req.user) {
      approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      if (!approverName) approverName = 'Executive Director';
    }

    console.log(`Executing approval by ${approverName} (${userId || 'anonymous'})`);
    console.log(`Project ID: ${req.params.id}`);

    const project = await Project.findById(req.params.id);

    if (!project) {
      console.log('Project not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`Found project: ${project.title}`);
    console.log(`Current approval status: ${project.approvalStatus}`);
    console.log(`WorkPlan items count: ${project.workPlan?.length || 0}`);

    // Validate workPlan data
    console.log('Validating workPlan data...');
    validateWorkPlan(project.workPlan);

    // Update approval data
    project.isApproved.byExecutiveDirector.approved = true;
    project.isApproved.byExecutiveDirector.approvedOn = new Date();
    project.isApproved.byExecutiveDirector.approvedBy = userId;

    // Set approvalStatus to 'approved'
    project.approvalStatus = 'approved';

    // Save changes
    await project.save();
    console.log('Project updated with Executive Director approval');

    // Credit all users in the workPlan
    try {
      if (!project.workPlan || !Array.isArray(project.workPlan) || project.workPlan.length === 0) {
        console.log('No workPlan items found for crediting');
      } else {
        console.log(`Processing ${project.workPlan.length} workPlan items for crediting...`);

        const Credit = require('../models/credit_model'); // Import Credit model

        let newCreditsCount = 0;

        // Process each workPlan entry and create credits
        for (const workPlanItem of project.workPlan) {
          console.log(`Processing workPlan item:`, JSON.stringify(workPlanItem));

          // Skip if no user ID
          if (!workPlanItem.espUserId) {
            console.log('Skipping workplan item - missing espUserId');
            continue;
          }

          try {
            console.log(`Checking for existing credit for user ${workPlanItem.espUserId}`);

            // Validate espUserId - it must be a valid MongoDB ObjectId
            let validUserId = workPlanItem.espUserId;
            const mongoose = require('mongoose');

            // Check if the ID is valid, if not try to clean it
            if (!mongoose.Types.ObjectId.isValid(validUserId)) {
              console.warn(`Invalid user ID format: ${validUserId}. Attempting to clean...`);

              // Try to clean the ID (remove quotes, trim, etc)
              validUserId = validUserId.trim();
              if (validUserId.startsWith('"') && validUserId.endsWith('"')) {
                validUserId = validUserId.slice(1, -1);
              }

              if (!mongoose.Types.ObjectId.isValid(validUserId)) {
                console.error(`Cannot create credit: Invalid user ID format even after cleaning: ${validUserId}`);
                continue; // Skip this workPlan item
              }
            }

            console.log(`Using validated user ID: ${validUserId}`);

            // Check if credit already exists for this user and project
            const existingCredit = await Credit.findOne({
              user: validUserId,
              project: project._id,
              source: 'project'
            });

            // Skip if credit already exists
            if (existingCredit) {
              console.log(`Credit already exists for user ${validUserId} in project ${project.title}`);
              continue;
            }

            console.log(`Creating new credit for user ${validUserId} (${workPlanItem.espName})`);

            // Create credit object
            const credit = new Credit({
              type: project.engagementType || 'College-Driven',
              user: validUserId,
              project: project._id,
              projectId: project._id.toString(), // For backward compatibility
              hours: workPlanItem.hoursReceived || 0,
              description: `Credit for ${project.title} - Role: ${workPlanItem.role || 'Participant'}`,
              source: 'project'
            });

            console.log(`Credit object created:`, JSON.stringify(credit));

            // Save the credit
            const savedCredit = await credit.save();
            console.log(`Credit saved successfully with ID: ${savedCredit._id}`);

            newCreditsCount++;
          } catch (err) {
            console.error(`Failed to create credit for user ${workPlanItem.espUserId}:`, err);
          }
        }

        console.log(`Created ${newCreditsCount} new credits for project ${project.title}`);
      }
    } catch (creditError) {
      console.error('Error in credit creation process:', creditError);
      // Don't fail the approval process if crediting fails
    }

    // Notify project creator
    await notifyProjectCreatorAboutApproval(project, 'byExecutiveDirector', approverName);

    console.log('====== EXECUTIVE DIRECTOR APPROVAL - COMPLETED ======');
    res.status(200).json(project);
  } catch (error) {
    console.error('Error approving project by executive director:', error);
    res.status(500).json({ message: error.message });
  }
};

// 4. Soft-delete operations
exports.deactivateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, { isActivated: false }, { new: true });

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
    const project = await Project.findByIdAndUpdate(req.params.id, { isActivated: true }, { new: true });

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

    // Get the user info for notification
    const signer = await User.findById(userId);
    let signerName = workPlanEntry.espName;
    if (signer) {
      signerName = `${signer.firstName} ${signer.lastName}`;
    }

    // Save the project
    await project.save();

    // Send notification to project creator
    await notifyProjectCreatorAboutWorkplanSigning(project, signerName, workPlanEntry.activity, workPlanEntry.role);

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recalculate credits for an already approved project
exports.recalculateProjectCredits = async (req, res) => {
  try {
    console.log('====== RECALCULATE PROJECT CREDITS - STARTED ======');

    const projectId = req.params.id;
    console.log(`Recalculating credits for project: ${projectId}`);

    const project = await Project.findById(projectId);

    if (!project) {
      console.log('Project not found with ID:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`Found project: ${project.title}`);
    console.log(`Current approval status: ${project.approvalStatus}`);
    console.log(`WorkPlan items count: ${project.workPlan?.length || 0}`);

    // Check if project is approved by Executive Director
    if (!project.isApproved.byExecutiveDirector.approved) {
      console.log('Project is not approved by Executive Director - cannot create credits');
      return res.status(400).json({
        message: 'Cannot calculate credits for unapproved projects. Project must be approved by Executive Director first.'
      });
    }

    // Validate workPlan data
    console.log('Validating workPlan data...');
    const isValid = validateWorkPlan(project.workPlan);

    if (!isValid) {
      console.log('WARNING: WorkPlan validation failed - will attempt to process anyway');
    }

    const Credit = require('../models/credit_model');
    const mongoose = require('mongoose');
    let newCreditsCount = 0;
    let errorCount = 0;

    // Process each workPlan entry and create credits
    if (!project.workPlan || !Array.isArray(project.workPlan)) {
      console.log('No valid workPlan array found');
      return res.status(400).json({
        message: 'No valid workPlan found in project'
      });
    }

    console.log(`Processing ${project.workPlan.length} workPlan items...`);

    for (const workPlanItem of project.workPlan) {
      console.log(`Processing workPlan item:`, JSON.stringify(workPlanItem));

      // Skip if no user ID
      if (!workPlanItem.espUserId) {
        console.log('Skipping workplan item - missing espUserId');
        continue;
      }

      try {
        // Validate espUserId - it must be a valid MongoDB ObjectId
        let validUserId = workPlanItem.espUserId;

        // Check if the ID is valid, if not try to clean it
        if (!mongoose.Types.ObjectId.isValid(validUserId)) {
          console.warn(`Invalid user ID format: ${validUserId}. Attempting to clean...`);

          // Try to clean the ID (remove quotes, trim, etc)
          validUserId = validUserId.trim();
          if (validUserId.startsWith('"') && validUserId.endsWith('"')) {
            validUserId = validUserId.slice(1, -1);
          }

          if (!mongoose.Types.ObjectId.isValid(validUserId)) {
            console.error(`Cannot create credit: Invalid user ID format even after cleaning: ${validUserId}`);
            errorCount++;
            continue; // Skip this workPlan item
          }
        }

        console.log(`Checking for existing credit for user ${validUserId}`);

        // Check if credit already exists for this user and project
        const existingCredit = await Credit.findOne({
          user: validUserId,
          project: project._id,
          source: 'project'
        });

        // Skip if credit already exists
        if (existingCredit) {
          console.log(`Credit already exists for user ${validUserId} in project ${project.title}`);
          continue;
        }

        // Create credit object with validated data
        const credit = new Credit({
          type: project.engagementType || 'College-Driven',
          user: validUserId,
          project: project._id,
          projectId: project._id.toString(),
          hours: workPlanItem.hoursReceived || 0,
          description: `Credit for ${project.title} - Role: ${workPlanItem.role || 'Participant'}`,
          source: 'project'
        });

        console.log(`Credit object created:`, JSON.stringify(credit));

        // Save the credit
        const savedCredit = await credit.save();
        console.log(`Credit saved successfully with ID: ${savedCredit._id}`);

        newCreditsCount++;
      } catch (err) {
        console.error(`Error creating credit for user ${workPlanItem.espUserId}:`, err);
        errorCount++;
      }
    }

    console.log('====== RECALCULATE PROJECT CREDITS - COMPLETED ======');
    console.log(`Summary: Created ${newCreditsCount} credits, encountered ${errorCount} errors`);

    res.status(200).json({
      message: `Created ${newCreditsCount} new credits for project ${project.title}`,
      projectId: project._id,
      newCreditsCount,
      errorCount
    });
  } catch (error) {
    console.error('Error recalculating project credits:', error);
    res.status(500).json({ message: error.message });
  }
};

// Set up Multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Controller to handle thumbnail upload
const uploadThumbnail = async (req, res) => {
  const thumbnailFile = req.file; // Multer provides the file as req.file
  const projectId = req.params.id; // Project ID from URL params

  if (!thumbnailFile) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    console.log('Uploading thumbnail for project:', projectId);

    // Upload the image to Vercel Blob
    const { url } = await put(`project-thumbnails/${projectId}-${Date.now()}.png`, thumbnailFile.buffer, {
      access: 'public'
    });

    // Update MongoDB with the new thumbnail URL without modifying other project fields
    const project = await Project.findByIdAndUpdate(projectId, { thumbnail: url }, { new: true });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({
      message: 'Thumbnail uploaded successfully',
      thumbnailUrl: url,
      project
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ message: 'Error uploading thumbnail', error });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  getProjectsByProgram,
  getApprovedProjectsByProgram,
  getPendingProjectsByProgram,
  getDeactivatedProjectsByProgram,
  getApprovedProjects,
  getPendingProjects,
  getDeactivatedProjects,
  updateProject,
  deactivateProject,
  restoreProject,
  approveProjectByRepresentative,
  approveProjectByDean,
  approveProjectByComexCoordinator,
  approveProjectByGeneralAccountingSupervisor,
  approveProjectByAcademicServicesDirector,
  approveProjectByAcademicDirector,
  approveProjectByExecutiveDirector,
  getPendingWorkplanApprovals,
  getSignedWorkplanApprovals,
  signWorkplanEntry,
  recalculateProjectCredits,
  upload,
  uploadThumbnail
};
