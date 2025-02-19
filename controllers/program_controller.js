const Program = require("../models/program_model");

// Helper function to exclude soft-deleted records
const excludeDeleted = { isDeleted: false };

// 1. Create a new program
const createProgram = async (req, res) => {
  try {
    const { title, description, createdBy } = req.body;

    const newProgram = new Program({
      title,
      description,
      isApproved: false, // Default to unapproved
      createdBy,
    });

    const savedProgram = await newProgram.save();
    res.status(201).json({
      success: true,
      message: "Program created successfully",
      program: savedProgram,
    });
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({
      success: false,
      message: "Error creating program",
      error,
    });
  }
};

// 2. Fetch all approved programs
const getApprovedPrograms = async (req, res) => {
  try {
    const approvedPrograms = await Program.find({
      isApproved: true,
      ...excludeDeleted,
    });
    res.status(200).json({ success: true, programs: approvedPrograms });
  } catch (error) {
    console.error("Error fetching approved programs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching approved programs",
      error,
    });
  }
};

// 3. Fetch all unapproved programs
const getUnapprovedPrograms = async (req, res) => {
  try {
    const unapprovedPrograms = await Program.find({
      isApproved: false,
      ...excludeDeleted,
    });
    res.status(200).json({ success: true, programs: unapprovedPrograms });
  } catch (error) {
    console.error("Error fetching unapproved programs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unapproved programs",
      error,
    });
  }
};

// 4. Fetch all programs
const getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.find(excludeDeleted);
    res.status(200).json({ success: true, programs });
  } catch (error) {
    console.error("Error fetching all programs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching all programs",
      error,
    });
  }
};

// 5. Approve a program
const approveProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const updatedProgram = await Program.findOneAndUpdate(
      { _id: programId, ...excludeDeleted },
      { isApproved: true },
      { new: true, runValidators: true }
    );

    if (!updatedProgram) {
      return res
        .status(404)
        .json({ success: false, message: "Program not found" });
    }

    res.status(200).json({
      success: true,
      message: "Program approved successfully",
      program: updatedProgram,
    });
  } catch (error) {
    console.error("Error approving program:", error);
    res.status(500).json({
      success: false,
      message: "Error approving program",
      error,
    });
  }
};

// 6. Fetch a single program by ID
const getProgramById = async (req, res) => {
  try {
    const programId = req.params.id;
    const program = await Program.findOne({
      _id: programId,
      ...excludeDeleted,
    });

    if (!program) {
      return res
        .status(404)
        .json({ success: false, message: "Program not found" });
    }

    res.status(200).json({ success: true, program });
  } catch (error) {
    console.error("Error fetching program by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching program by ID",
      error,
    });
  }
};

// 7. Update a program
const updateProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const { title, description } = req.body;

    const updatedProgram = await Program.findOneAndUpdate(
      { _id: programId, ...excludeDeleted },
      { title, description },
      { new: true, runValidators: true }
    );

    if (!updatedProgram) {
      return res
        .status(404)
        .json({ success: false, message: "Program not found" });
    }

    res.status(200).json({
      success: true,
      message: "Program updated successfully",
      program: updatedProgram,
    });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({
      success: false,
      message: "Error updating program",
      error,
    });
  }
};

// 8. Soft-delete a program
const deleteProgram = async (req, res) => {
  try {
    const programId = req.params.id;

    const deletedProgram = await Program.findOneAndUpdate(
      { _id: programId, ...excludeDeleted },
      { isDeleted: true },
      { new: true }
    );

    if (!deletedProgram) {
      return res
        .status(404)
        .json({ success: false, message: "Program not found" });
    }

    res.status(200).json({
      success: true,
      message: "Program deleted successfully",
      program: deletedProgram,
    });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting program",
      error,
    });
  }
};

// New: Fetch all programs by department
const getProgramsByDepartment = async (req, res) => {
  try {
    const department = req.params.department;
    const programs = await Program.find({ department, isDeleted: false });
    res.status(200).json({ success: true, programs });
  } catch (error) {
    console.error("Error fetching programs by department:", error);
    res.status(500).json({ success: false, message: "Error fetching programs by department", error });
  }
};

module.exports = {
  createProgram,
  getApprovedPrograms,
  getUnapprovedPrograms,
  getAllPrograms,
  approveProgram,
  getProgramById,
  updateProgram,
  deleteProgram,
  getProgramsByDepartment,
};
