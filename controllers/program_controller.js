const Program = require('../models/program_model');

// 1. Create a new program
const createProgram = async (req, res) => {
  try {
    const { title, description, createdBy } = req.body;

    // Create a new Program instance
    const newProgram = new Program({
      title,
      description,
      isApproved: false, // Default to unapproved
      createdBy,
    });

    // Save the program to the database
    const savedProgram = await newProgram.save();
    res.status(201).json({ success: true, message: 'Program created successfully', program: savedProgram });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ success: false, message: 'Error creating program', error });
  }
};

// 2. Fetch all approved programs
const getApprovedPrograms = async (req, res) => {
  try {
    const approvedPrograms = await Program.find({ isApproved: true });
    res.status(200).json({ success: true, programs: approvedPrograms });
  } catch (error) {
    console.error('Error fetching approved programs:', error);
    res.status(500).json({ success: false, message: 'Error fetching approved programs', error });
  }
};

// 3. Fetch all unapproved programs
const getUnapprovedPrograms = async (req, res) => {
  try {
    const unapprovedPrograms = await Program.find({ isApproved: false });
    res.status(200).json({ success: true, programs: unapprovedPrograms });
  } catch (error) {
    console.error('Error fetching unapproved programs:', error);
    res.status(500).json({ success: false, message: 'Error fetching unapproved programs', error });
  }
};

// 4. Fetch all programs
const getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.find();
    res.status(200).json({ success: true, programs });
  } catch (error) {
    console.error('Error fetching all programs:', error);
    res.status(500).json({ success: false, message: 'Error fetching all programs', error });
  }
};

// 5. Approve a program
const approveProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const updatedProgram = await Program.findByIdAndUpdate(
      programId,
      { isApproved: true },
      { new: true, runValidators: true }
    );

    if (!updatedProgram) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    res.status(200).json({ success: true, message: 'Program approved successfully', program: updatedProgram });
  } catch (error) {
    console.error('Error approving program:', error);
    res.status(500).json({ success: false, message: 'Error approving program', error });
  }
};

module.exports = {
  createProgram,
  getApprovedPrograms,
  getUnapprovedPrograms,
  getAllPrograms,
  approveProgram,
};
