    const Program = require('../models/program_model');

    // Create a new program
    const createProgram = async (req, res) => {
    try {
        const { title, description, createdBy } = req.body;

        // Create a new Program instance
        const newProgram = new Program({
        title,
        description,
        isApproved,
        createdBy
        });

        // Save the program to the database
        await newProgram.save();
        res.status(201).json({ message: 'Program created successfully', program: newProgram });
    } catch (error) {
        res.status(500).json({ message: 'Error creating program', error });
    }
    };

    // Get all approved programs
    const getApprovedPrograms = async (req, res) => {
    try {
        const approvedPrograms = await Program.find({ isApproved: true });
        res.status(200).json(approvedPrograms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching approved programs', error });
    }
    };

    // Get all unapproved programs
    const getUnapprovedPrograms = async (req, res) => {
    try {
        const unapprovedPrograms = await Program.find({ isApproved: false });
        res.status(200).json(unapprovedPrograms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unapproved programs', error });
    }
    };

    module.exports = {
    createProgram,
    getApprovedPrograms,
    getUnapprovedPrograms
    };
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
    