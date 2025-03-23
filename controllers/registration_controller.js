const Registration = require('../models/registration_model');
const Project = require('../models/project_model');
const Response = require('../models/response_model');
const User = require('../models/user_model');

// Helper function to create a new user if they don't exist
const ensureUserExists = async (email, name) => {
  // Try to find the user first
  let user = await User.findOne({ email });

  // If user doesn't exist, create one
  if (!user && email) {
    // Parse name if available
    let firstName = name;
    let lastName = '';

    if (name && name.includes(' ')) {
      const nameParts = name.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    // Create new user with basic info
    user = new User({
      email,
      firstName: firstName || 'User',
      lastName: lastName || '',
      usertype: 'student',
      password: 'temporary' // This should be changed in a real implementation
    });

    await user.save();
  }

  return user;
};

// Create a new registration from a form response
exports.createRegistrationFromResponse = async (req, res) => {
  try {
    const { responseId, projectId, role, hoursToRender, addToWorkPlan } = req.body;

    // Get the response to validate it's related to this project
    const response = await Response.findById(responseId);
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Find or create the user based on the response
    let user;
    if (response.respondent.user) {
      // If user ID is included in the response, find by ID
      user = await User.findById(response.respondent.user);
    } else if (response.respondent.email) {
      // If not, try to find or create by email
      user = await ensureUserExists(response.respondent.email, response.respondent.name);
    }

    // If we still can't find or create the user, return an error
    if (!user) {
      return res.status(404).json({
        message: 'User cannot be found or created. Make sure the response contains a valid email.'
      });
    }

    // Verify the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if registration already exists
    const existingRegistration = await Registration.findOne({
      user: user._id,
      project: projectId
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'User is already registered for this project' });
    }

    // Create registration
    const registration = new Registration({
      user: user._id,
      project: projectId,
      response: responseId,
      role: role || 'Participant',
      hoursToRender: hoursToRender || 0,
      status: 'active'
    });

    // Save the registration
    const savedRegistration = await registration.save();

    // Update the project's workPlan if needed
    if (addToWorkPlan) {
      await Project.findByIdAndUpdate(projectId, {
        $push: {
          workPlan: {
            activity: 'Participant',
            espName: user.name || response.respondent.name || 'Unknown',
            role: role || 'Participant',
            hoursReceived: hoursToRender || 0
          }
        }
      });
    }

    res.status(201).json(savedRegistration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all registrations
exports.getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('user', 'name email')
      .populate('project', 'title')
      .populate('response');

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get registrations by project
exports.getRegistrationsByProject = async (req, res) => {
  try {
    const registrations = await Registration.find({ project: req.params.projectId })
      .populate('user', 'name email')
      .populate('response');

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get registrations by user
exports.getRegistrationsByUser = async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.params.userId })
      .populate('project', 'title')
      .populate('response');

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update registration
exports.updateRegistration = async (req, res) => {
  try {
    const updatedRegistration = await Registration.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    if (!updatedRegistration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json(updatedRegistration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete registration
exports.deleteRegistration = async (req, res) => {
  try {
    const deletedRegistration = await Registration.findByIdAndDelete(req.params.id);

    if (!deletedRegistration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json({ message: 'Registration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark registration as completed
exports.completeRegistration = async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
