const Activity = require('../models/activity_model');

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
  approveActivity
};
