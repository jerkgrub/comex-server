const Credit = require('../models/credit_model');
const Project = require('../models/project_model');
const Response = require('../models/response_model');
const Registration = require('../models/registration_model');
const User = require('../models/user_model');
const { put } = require('@vercel/blob');
const multer = require('multer');

// Set up Multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    cb(null, true); // Accept any file type
  }
});

// Award credit based on form response
exports.awardCreditFromResponse = async (req, res) => {
  try {
    const { userId, projectId, responseId, hours, description } = req.body;

    // Verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if the project is approved
    const isApproved = project.isApproved.byExecutiveDirector.approved;
    if (!isApproved) {
      return res.status(400).json({ message: 'Cannot award credits for unapproved projects' });
    }

    // If responseId is provided, verify it exists
    if (responseId) {
      const response = await Response.findById(responseId);
      if (!response) {
        return res.status(404).json({ message: 'Response not found' });
      }
    }

    // Check if the user is registered for this project
    const registration = await Registration.findOne({
      user: userId,
      project: projectId
    });

    // Create the credit
    const credit = new Credit({
      user: userId,
      project: projectId,
      registration: registration ? registration._id : null,
      response: responseId || null,
      hours: hours,
      description: description || `Credit for ${project.title}`,
      source: responseId ? 'form' : 'manual'
    });

    const savedCredit = await credit.save();

    res.status(201).json(savedCredit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all credits for a user
exports.getUserCredits = async (req, res) => {
  try {
    const credits = await Credit.find({ user: req.params.userId })
      .populate('project', 'title')
      .populate('response')
      .sort({ awardedAt: -1 });

    const totalHours = credits.reduce((sum, credit) => sum + credit.hours, 0);

    res.status(200).json({
      credits,
      totalHours
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all credits for a project
exports.getProjectCredits = async (req, res) => {
  try {
    const credits = await Credit.find({ project: req.params.projectId })
      .populate('user', 'name email')
      .populate('response')
      .sort({ awardedAt: -1 });

    const totalHours = credits.reduce((sum, credit) => sum + credit.hours, 0);

    res.status(200).json({
      credits,
      totalHours
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get credit by ID
exports.getCreditById = async (req, res) => {
  try {
    const credit = await Credit.findById(req.params.id)
      .populate('user', 'name email')
      .populate('project', 'title')
      .populate('response');

    if (!credit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json(credit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update credit
exports.updateCredit = async (req, res) => {
  try {
    const updatedCredit = await Credit.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedCredit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json(updatedCredit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete credit
exports.deleteCredit = async (req, res) => {
  try {
    const deletedCredit = await Credit.findByIdAndDelete(req.params.id);

    if (!deletedCredit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ message: 'Credit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy functions maintained for compatibility
exports.getCreditDetails = async (req, res) => {
  try {
    const credit = await Credit.findById(req.params.creditId)
      .populate('user', 'name email')
      .populate('project', 'title');

    if (!credit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ credit });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching credit details', error: error.message });
  }
};

exports.revokeCredit = async (req, res) => {
  try {
    const credit = await Credit.findByIdAndDelete(req.params.creditId);

    if (!credit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ message: 'Credit successfully revoked', credit });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking credit', error: error.message });
  }
};

exports.getResponseCredits = async (req, res) => {
  try {
    const credits = await Credit.find({ response: req.params.responseId })
      .populate('user', 'name email')
      .populate('project', 'title');

    res.status(200).json({ credits });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching response credits', error: error.message });
  }
};

exports.createCreditManually = async (req, res) => {
  try {
    const {
      user,
      project,
      registration,
      response,
      hours,
      description,
      source = 'manual'
    } = req.body;

    if (!user) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['user']
      });
    }

    // Validate hours if provided
    const creditHours = hours !== undefined ? parseFloat(hours) : 1;
    if (isNaN(creditHours) || creditHours < 0) {
      return res.status(400).json({
        message: 'Invalid hours value. Must be a positive number.',
        providedValue: hours
      });
    }

    const credit = new Credit({
      user,
      project,
      registration,
      response,
      hours: creditHours,
      description: description || 'Manually created credit',
      awardedAt: new Date(),
      source
    });

    await credit.save();

    res.status(201).json({
      message: 'Credit created successfully',
      credit
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating credit', error: error.message });
  }
};

exports.getUserResponseCredits = async (req, res) => {
  try {
    const { userId, responseId } = req.params;

    const credits = await Credit.find({ user: userId, response: responseId })
      .populate('user', 'name email')
      .populate('project', 'title');

    if (!credits.length) {
      return res.status(404).json({ message: 'No credits found for this user and response' });
    }

    res.status(200).json({ credits });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user response credits', error: error.message });
  }
};
