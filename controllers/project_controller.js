const Project = require('../models/project_model');

// 1. Create a new project
exports.createProject = async (req, res) => {
  try {
    const { title, programId, createdBy } = req.body;

    const newProject = new Project({
      title,
      programId,
      createdBy,
      isApproved: false, // Default to unapproved
    });

    const savedProject = await newProject.save();
    res.status(201).json({ success: true, message: 'Project created successfully', project: savedProject });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Error creating project', error });
  }
};

// 2. Fetch all approved projects
exports.getApprovedProjects = async (req, res) => {
  try {
    const approvedProjects = await Project.find({ isApproved: true });
    res.status(200).json({ success: true, projects: approvedProjects });
  } catch (error) {
    console.error('Error fetching approved projects:', error);
    res.status(500).json({ success: false, message: 'Error fetching approved projects', error });
  }
};

// 3. Fetch all unapproved projects
exports.getUnapprovedProjects = async (req, res) => {
  try {
    const unapprovedProjects = await Project.find({ isApproved: false });
    res.status(200).json({ success: true, projects: unapprovedProjects });
  } catch (error) {
    console.error('Error fetching unapproved projects:', error);
    res.status(500).json({ success: false, message: 'Error fetching unapproved projects', error });
  }
};

// 4. Fetch all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching all projects:', error);
    res.status(500).json({ success: false, message: 'Error fetching all projects', error });
  }
};

// 5. Approve a project
exports.approveProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { isApproved: true },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, message: 'Project approved successfully', project: updatedProject });
  } catch (error) {
    console.error('Error approving project:', error);
    res.status(500).json({ success: false, message: 'Error approving project', error });
  }
};
