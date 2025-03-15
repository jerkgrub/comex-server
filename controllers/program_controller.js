const Program = require('../models/program_model');

// 1. Create a new program
exports.createProgram = async (req, res) => {
  try {
    const programData = {
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

    const program = new Program(programData);
    const savedProgram = await program.save();
    res.status(201).json(savedProgram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Read operations
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ isActivated: true });
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProgramById = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProgramsByDepartment = async (req, res) => {
  try {
    const programs = await Program.find({
      department: req.params.department,
      isActivated: true
    });
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getApprovedProgramsByDepartment = async (req, res) => {
  try {
    const programs = await Program.find({
      department: req.params.department,
      isActivated: true,
      'isApproved.byRepresentative': true,
      'isApproved.byDean': true,
      'isApproved.byGeneralAccountingSupervisor': true,
      'isApproved.byComexCoordinator': true,
      'isApproved.byAcademicServicesDirector': true,
      'isApproved.byAcademicDirector': true,
      'isApproved.byExecutiveDirector': true
    });
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingProgramsByDepartment = async (req, res) => {
  try {
    const programs = await Program.find({
      department: req.params.department,
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
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeactivatedProgramsByDepartment = async (req, res) => {
  try {
    const programs = await Program.find({
      department: req.params.department,
      isActivated: false
    });
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getApprovedPrograms = async (req, res) => {
  try {
    const programs = await Program.find({
      isActivated: true,
      'isApproved.byRepresentative': true,
      'isApproved.byDean': true,
      'isApproved.byGeneralAccountingSupervisor': true,
      'isApproved.byComexCoordinator': true,
      'isApproved.byAcademicServicesDirector': true,
      'isApproved.byAcademicDirector': true,
      'isApproved.byExecutiveDirector': true
    });
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingPrograms = async (req, res) => {
  try {
    const programs = await Program.find({
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
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeactivatedPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ isActivated: false });
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Update operations
exports.updateProgram = async (req, res) => {
  try {
    const updatedProgram = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedProgram) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(updatedProgram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approval functions
exports.approveProgramByRepresentative = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { 'isApproved.byRepresentative': true }, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProgramByDean = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { 'isApproved.byDean': true }, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProgramByGeneralAccountingSupervisor = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { 'isApproved.byGeneralAccountingSupervisor': true }, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProgramByComexCoordinator = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { 'isApproved.byComexCoordinator': true }, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProgramByAcademicServicesDirector = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { 'isApproved.byAcademicServicesDirector': true }, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProgramByAcademicDirector = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { 'isApproved.byAcademicDirector': true }, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveProgramByExecutiveDirector = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { 'isApproved.byExecutiveDirector': true }, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Soft-delete operations
exports.deactivateProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { isActivated: false }, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.restoreProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { isActivated: true }, { new: true });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
