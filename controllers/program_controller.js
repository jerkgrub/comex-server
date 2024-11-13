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
