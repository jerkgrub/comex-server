const Project = require('../models/project_model');

// Create a new project
exports.createProject = async (req, res) => {
  const { title, programId, createdBy } = req.body;

  try {
    const newProject = new Project({
      title,
      programId,
      createdBy,
      isApproved: false, // Default to unapproved
    });

    await newProject.save();
    res.status(201).json({ success: true, message: 'Project created successfully', data: newProject });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Error creating project', error });
  }
};

// Get all approved projects
exports.getApprovedProjects = async (req, res) => {
  try {
    const approvedProjects = await Project.find({ isApproved: true });
    res.status(200).json({ success: true, data: approvedProjects });
  } catch (error) {
    console.error('Error fetching approved projects:', error);
    res.status(500).json({ success: false, message: 'Error fetching approved projects', error });
  }
};

// Get all unapproved projects
exports.getUnapprovedProjects = async (req, res) => {
  try {
    const unapprovedProjects = await Project.find({ isApproved: false });
    res.status(200).json({ success: true, data: unapprovedProjects });
  } catch (error) {
    console.error('Error fetching unapproved projects:', error);
    res.status(500).json({ success: false, message: 'Error fetching unapproved projects', error });
  }
};
