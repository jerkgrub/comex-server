const Project = require("../models/project_model");

// Helper function to exclude soft-deleted records
const excludeDeleted = { isDeleted: false };

// 1. Create a new project
const createProject = async (req, res) => {
  try {
    const { title, programId, createdBy } = req.body;

    const newProject = new Project({
      title,
      programId,
      createdBy,
      isApproved: false, // Default to unapproved
    });

    const savedProject = await newProject.save();
    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: savedProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      message: "Error creating project",
      error,
    });
  }
};

// 2. Fetch all approved projects
const getApprovedProjects = async (req, res) => {
  try {
    const approvedProjects = await Project.find({
      isApproved: true,
      ...excludeDeleted,
    });
    res.status(200).json({ success: true, projects: approvedProjects });
  } catch (error) {
    console.error("Error fetching approved projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching approved projects",
      error,
    });
  }
};

// 3. Fetch all unapproved projects
const getUnapprovedProjects = async (req, res) => {
  try {
    const unapprovedProjects = await Project.find({
      isApproved: false,
      ...excludeDeleted,
    });
    res.status(200).json({ success: true, projects: unapprovedProjects });
  } catch (error) {
    console.error("Error fetching unapproved projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unapproved projects",
      error,
    });
  }
};

// 4. Fetch all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find(excludeDeleted);
    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("Error fetching all projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching all projects",
      error,
    });
  }
};

// 5. Approve a project
const approveProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const updatedProject = await Project.findOneAndUpdate(
      { _id: projectId, ...excludeDeleted },
      { isApproved: true },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    res.status(200).json({
      success: true,
      message: "Project approved successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error approving project:", error);
    res.status(500).json({
      success: false,
      message: "Error approving project",
      error,
    });
  }
};

// 6. Fetch a single project by ID
const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({
      _id: projectId,
      ...excludeDeleted,
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project by ID",
      error,
    });
  }
};

// 7. Update a project
const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, programId } = req.body;

    const updatedProject = await Project.findOneAndUpdate(
      { _id: projectId, ...excludeDeleted },
      { title, programId },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({
      success: false,
      message: "Error updating project",
      error,
    });
  }
};

// 8. Soft-delete a project
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    const deletedProject = await Project.findOneAndUpdate(
      { _id: projectId, ...excludeDeleted },
      { isDeleted: true },
      { new: true }
    );

    if (!deletedProject) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      project: deletedProject,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting project",
      error,
    });
  }
};

// New: Fetch all projects belonging to a given program
const getProjectsByProgram = async (req, res) => {
  try {
    const programId = req.params.programId;
    const projects = await Project.find({ programId, isDeleted: false });
    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("Error fetching projects by program:", error);
    res.status(500).json({ success: false, message: "Error fetching projects by program", error });
  }
};

module.exports = {
  createProject,
  getApprovedProjects,
  getUnapprovedProjects,
  getAllProjects,
  approveProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByProgram,
};
