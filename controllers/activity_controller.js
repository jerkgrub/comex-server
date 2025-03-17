const Activity = require('../models/activity_model');
const Credit = require('../models/credit_model');

// Fetch activities where the user is a respondent
const findJoinedActivities = (req, res) => {
  const userId = req.params.id; // Get the user ID from the request parameters

  Activity.find({ 'respondents.userId': userId, isActivated: { $ne: false } }) // Query activities where the user is a respondent and not deactivated
    .then(joinedActivities => {
      if (joinedActivities.length > 0) {
        res.json({ Activities: joinedActivities });
      } else {
        res.json({ message: "Haven't registered for any activities yet." });
      }
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

const findHighlights = (req, res) => {
  Activity.find({
    type: { $in: ['Institutional', 'College Driven'] },
    isApproved: true,
    isActivated: { $ne: false }
  })
    .then(highlightActivities => {
      res.json({ Activities: highlightActivities });
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// Fetch approved activities
const findApprovedActivities = (req, res) => {
  Activity.find({ isApproved: true, isActivated: { $ne: false } })
    .then(approvedActivities => {
      res.json({ Activities: approvedActivities });
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// Fetch pending activities (not approved yet)
const findPendingActivities = (req, res) => {
  Activity.find({ isApproved: false, isActivated: { $ne: false } })
    .then(pendingActivities => {
      res.json({ Activities: pendingActivities });
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// 1. Create new activity
const newActivity = (req, res) => {
  try {
    // Set isActivated to true by default for new activities
    const activityData = { ...req.body, isActivated: true };

    Activity.create(activityData)
      .then(newActivity => {
        res.send({ newActivity: newActivity, status: 'successfully inserted' });
      })
      .catch(err => {
        res.send({ message: 'Something went wrong', error: err });
      });
  } catch (error) {
    res.send(error);
  }
};

// 2. Fetch all activities
const findAllActivity = (req, res) => {
  // Build a filter object based on optional query parameters: type, programId, projectId
  const filter = { isActivated: { $ne: false } }; // Only show activated activities

  if (req.query.type) {
    filter.type = req.query.type;
  }
  if (req.query.programId) {
    filter.programId = req.query.programId;
  }
  if (req.query.projectId) {
    filter.projectId = req.query.projectId;
  }

  Activity.find(filter)
    .then(allActivities => {
      res.json({ Activities: allActivities });
    })
    .catch(err => {
      res.json({ message: 'Something went wrong', error: err });
    });
};

// 3. Find one activity by ID
const findOneActivity = (req, res) => {
  Activity.findById(req.params.id)
    .then(activity => {
      if (activity) {
        res.json({ Activity: activity });
      } else {
        res.status(404).json({ message: 'Activity not found' });
      }
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// 4. Update an activity by ID
const updateActivity = (req, res) => {
  Activity.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true
  })
    .then(updatedActivity => {
      res.json({
        updatedActivity: updatedActivity,
        status: 'successfully Updated the Activity'
      });
    })
    .catch(err => {
      res.json({ message: 'Something went wrong', error: err });
    });
};

// 5. Delete an activity by ID
const deleteActivity = (req, res) => {
  Activity.findOneAndDelete({ _id: req.params.id })
    .then(deletedActivity => {
      if (deletedActivity) {
        res.json({ message: 'Activity successfully deleted', deletedActivity });
      } else {
        res.status(404).json({ message: 'Activity not found' });
      }
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// Deactivate an activity (soft delete)
const deactivateActivity = (req, res) => {
  Activity.findByIdAndUpdate(req.params.id, { isActivated: false }, { new: true })
    .then(deactivatedActivity => {
      if (!deactivatedActivity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      res.json({
        message: 'Activity successfully deactivated',
        activity: deactivatedActivity
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Error deactivating activity', error: err });
    });
};

// Restore a deactivated activity
const restoreActivity = (req, res) => {
  Activity.findByIdAndUpdate(req.params.id, { isActivated: true }, { new: true })
    .then(restoredActivity => {
      if (!restoredActivity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      res.json({
        message: 'Activity successfully restored',
        activity: restoredActivity
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Error restoring activity', error: err });
    });
};

// Get deactivated activities
const getDeactivatedActivities = (req, res) => {
  Activity.find({ isActivated: false })
    .then(deactivatedActivities => {
      res.json({ Activities: deactivatedActivities });
    })
    .catch(err => {
      res.status(500).json({ message: 'Error fetching deactivated activities', error: err });
    });
};

// RESPONDENTS SECTION //////////////////////////////////////////////////////////////////////////////////

// Add a respondent to an activity
const addRespondent = (req, res) => {
  const activityId = req.params.id;
  const { userId } = req.body; // Only the userId is passed

  Activity.findById(activityId)
    .then(activity => {
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      // Check if the respondent with the provided userId already exists
      const existingRespondent = activity.respondents.find(
        respondent => respondent.userId === userId
      );
      if (existingRespondent) {
        return res.status(400).json({ message: 'Respondent with the same userId already exists' });
      }

      // Add the new respondent
      activity.respondents.push({ userId });
      return activity.save();
    })
    .then(updatedActivity => {
      res.json({
        updatedActivity: updatedActivity,
        status: 'Respondent added successfully'
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// Get all respondents of an activity
const getAllRespondents = (req, res) => {
  Activity.findById(req.params.id)
    .then(activity => {
      if (activity) {
        res.json({ respondents: activity.respondents });
      } else {
        res.status(404).json({ message: 'Activity not found' });
      }
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// Remove a respondent from an activity
const removeRespondent = (req, res) => {
  const { activityId, userId } = req.params;

  Activity.findById(activityId)
    .then(activity => {
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      // Filter out the respondent by userId
      activity.respondents = activity.respondents.filter(
        respondent => respondent.userId !== userId
      );

      return activity.save();
    })
    .then(updatedActivity => {
      res.json({
        updatedActivity: updatedActivity,
        status: 'Respondent removed successfully'
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// New: Get activities by project ID
const getActivitiesByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const activities = await Activity.find({ projectId, isActivated: { $ne: false } });
    res.status(200).json({ Activities: activities });
  } catch (error) {
    console.error('Error fetching activities by project:', error);
    res.status(500).json({ message: 'Error fetching activities by project', error });
  }
};

// Project-specific pending activities
const findPendingActivitiesByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const activities = await Activity.find({
      projectId,
      isApproved: false,
      isActivated: { $ne: false }
    });
    res.json({ Activities: activities });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending activities by project', error });
  }
};

// Project-specific approved activities
const findApprovedActivitiesByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const activities = await Activity.find({
      projectId,
      isApproved: true,
      isActivated: { $ne: false }
    });
    res.json({ Activities: activities });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved activities by project', error });
  }
};

// Project-specific deactivated activities
const getDeactivatedActivitiesByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const activities = await Activity.find({
      projectId,
      isActivated: false
    });
    res.json({ Activities: activities });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deactivated activities by project', error });
  }
};

// Institutional activities
const findInstitutionalActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      type: 'Institutional',
      isActivated: { $ne: false }
    });
    res.json({ Activities: activities });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching institutional activities', error });
  }
};

// Institutional pending activities
const findPendingInstitutionalActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      type: 'Institutional',
      isApproved: false,
      isActivated: { $ne: false }
    });
    res.json({ Activities: activities });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending institutional activities', error });
  }
};

// Institutional approved activities
const findApprovedInstitutionalActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      type: 'Institutional',
      isApproved: true,
      isActivated: { $ne: false }
    });
    res.json({ Activities: activities });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved institutional activities', error });
  }
};

// Institutional deactivated activities
const getDeactivatedInstitutionalActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      type: 'Institutional',
      isActivated: false
    });
    res.json({ Activities: activities });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deactivated institutional activities', error });
  }
};

// Approve an activity
const approveActivity = (req, res) => {
  Activity.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true })
    .then(approvedActivity => {
      if (!approvedActivity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      res.json({
        message: 'Activity successfully approved',
        activity: approvedActivity
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Error approving activity', error: err });
    });
};

// Activity-Form Linking Methods
const linkFormToActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { formId } = req.body;

    if (!activityId || !formId) {
      return res.status(400).json({
        message: 'Activity ID and Form ID are required'
      });
    }

    // First, verify that both the activity and form exist
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }

    const Form = require('../models/form_model'); // Import the Form model
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        message: 'Form not found'
      });
    }

    // Create a new ActivityForm document to represent the link
    const ActivityForm = require('../models/activity_form_model'); // Import the ActivityForm model

    // Check if this link already exists
    const existingLink = await ActivityForm.findOne({
      activityId: activityId,
      formId: formId
    });

    if (existingLink) {
      return res.status(400).json({
        message: 'This form is already linked to the activity'
      });
    }

    // Create the new link
    const newLink = new ActivityForm({
      activityId,
      formId,
      status: 'pending' // Default status
    });

    await newLink.save();

    return res.status(201).json({
      message: 'Form linked to activity successfully',
      link: newLink
    });
  } catch (error) {
    console.error('Error in linkFormToActivity:', error);
    return res.status(500).json({
      message: 'Error linking form to activity',
      error: error.message
    });
  }
};

const getActivityForms = async (req, res) => {
  try {
    const { activityId } = req.params;

    // Verify the activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Import the ActivityForm model
    const ActivityForm = require('../models/activity_form_model');

    // Find all form links for this activity
    const formLinks = await ActivityForm.find({ activityId }).populate('formId');

    // Extract the form data from the populated links
    const forms = formLinks.map(link => ({
      ...link.formId._doc,
      _id: link.formId._id,
      status: link.status,
      linkId: link._id
    }));

    res.status(200).json(forms);
  } catch (error) {
    console.error('Error in getActivityForms:', error);
    res.status(500).json({
      message: 'Error fetching activity forms',
      error: error.message
    });
  }
};

const approveFormLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const activity = await Activity.findOne({ 'linkedForms._id': linkId });

    if (!activity) {
      return res.status(404).json({ message: 'Form link not found' });
    }

    const formLink = activity.linkedForms.id(linkId);
    formLink.status = 'approved';
    await activity.save();

    res.status(200).json({ message: 'Form link approved', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error approving form link', error: error.message });
  }
};

const removeFormLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    // Import the ActivityForm model
    const ActivityForm = require('../models/activity_form_model');

    // Find and delete the link
    const deletedLink = await ActivityForm.findByIdAndDelete(linkId);

    if (!deletedLink) {
      return res.status(404).json({ message: 'Form link not found' });
    }

    res.status(200).json({
      message: 'Form link removed successfully',
      deletedLink
    });
  } catch (error) {
    console.error('Error in removeFormLink:', error);
    res.status(500).json({
      message: 'Error removing form link',
      error: error.message
    });
  }
};

const getPendingForms = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await Activity.findById(activityId).populate('linkedForms.formId');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const pendingForms = activity.linkedForms.filter(link => link.status === 'pending');
    res.status(200).json({ forms: pendingForms });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending forms', error: error.message });
  }
};

const getApprovedForms = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await Activity.findById(activityId).populate('linkedForms.formId');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const approvedForms = activity.linkedForms.filter(link => link.status === 'approved');
    res.status(200).json({ forms: approvedForms });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved forms', error: error.message });
  }
};

const getActivityCredits = async (req, res) => {
  try {
    const { activityId } = req.params;
    const credits = await Credit.find({ activityId }).populate('userId');

    if (!credits.length) {
      return res.status(404).json({ message: 'No credits found for this activity' });
    }

    res.status(200).json({ credits });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity credits', error: error.message });
  }
};

module.exports = {
  // Activities
  newActivity,
  findAllActivity,
  findOneActivity,
  updateActivity,
  deleteActivity,

  // Respondents
  addRespondent,
  getAllRespondents,
  removeRespondent,

  // Universal activities
  findApprovedActivities,
  findPendingActivities,
  findHighlights,
  findJoinedActivities,

  // Soft deletion management
  deactivateActivity,
  restoreActivity,
  getDeactivatedActivities,

  // Project-specific activities
  getActivitiesByProject,
  findPendingActivitiesByProject,
  findApprovedActivitiesByProject,
  getDeactivatedActivitiesByProject,

  // Institutional activities
  findInstitutionalActivities,
  findPendingInstitutionalActivities,
  findApprovedInstitutionalActivities,
  getDeactivatedInstitutionalActivities,

  // Activity approval
  approveActivity,

  // Activity-Form Linking Methods
  linkFormToActivity,
  getActivityForms,
  approveFormLink,
  removeFormLink,
  getPendingForms,
  getApprovedForms,
  getActivityCredits
};
