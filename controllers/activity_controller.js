const Activity = require("../models/Activity_model");

// 1. Create new activity
const newActivity = (req, res) => {
  try {
    Activity.create(req.body)
      .then((newActivity) => {
        res.send({ newActivity: newActivity, status: "successfully inserted" });
      })
      .catch((err) => {
        res.send({ message: "Something went wrong", error: err });
      });
  } catch (error) {
    res.send(error);
  }
};

// 2. Fetch all activities
const findAllActivity = (req, res) => {
  Activity.find()
    .then((allActivities) => {
      res.json({ Activities: allActivities });
    })
    .catch((err) => {
      res.json({ message: "Something went wrong", error: err });
    });
};

// 3. Find one activity by ID
const findOneActivity = (req, res) => {
  Activity.findById(req.params.id)
    .then((activity) => {
      if (activity) {
        res.json({ Activity: activity });
      } else {
        res.status(404).json({ message: "Activity not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Something went wrong", error: err });
    });
};

// 4. Update an activity by ID
const updateActivity = (req, res) => {
  Activity.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  })
    .then((updatedActivity) => {
      res.json({
        updatedActivity: updatedActivity,
        status: "successfully Updated the Activity",
      });
    })
    .catch((err) => {
      res.json({ message: "Something went wrong", error: err });
    });
};

// 5. Delete an activity by ID
const deleteActivity = (req, res) => {
  Activity.findOneAndDelete({ _id: req.params.id })
    .then((deletedActivity) => {
      if (deletedActivity) {
        res.json({ message: "Activity successfully deleted", deletedActivity });
      } else {
        res.status(404).json({ message: "Activity not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Something went wrong", error: err });
    });
};

// RESPONDENTS SECTION //////////////////////////////////////////////////////////////////////////////////

// Add a respondent to an activity
const addRespondent = (req, res) => {
  const activityId = req.params.id;
  const { userId } = req.body; // Only the userId is passed

  Activity.findById(activityId)
    .then((activity) => {
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      // Check if the respondent with the provided userId already exists
      const existingRespondent = activity.respondents.find(
        (respondent) => respondent.userId === userId
      );
      if (existingRespondent) {
        return res
          .status(400)
          .json({ message: "Respondent with the same userId already exists" });
      }

      // Add the new respondent
      activity.respondents.push({ userId });
      return activity.save();
    })
    .then((updatedActivity) => {
      res.json({
        updatedActivity: updatedActivity,
        status: "Respondent added successfully",
      });
    })
    .catch((err) => {
      res.status(500).json({ message: "Something went wrong", error: err });
    });
};

// Get all respondents of an activity
const getAllRespondents = (req, res) => {
  Activity.findById(req.params.id)
    .then((activity) => {
      if (activity) {
        res.json({ respondents: activity.respondents });
      } else {
        res.status(404).json({ message: "Activity not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Something went wrong", error: err });
    });
};

// Remove a respondent from an activity
const removeRespondent = (req, res) => {
  const { activityId, userId } = req.params;

  Activity.findById(activityId)
    .then((activity) => {
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      // Filter out the respondent by userId
      activity.respondents = activity.respondents.filter(
        (respondent) => respondent.userId !== userId
      );

      return activity.save();
    })
    .then((updatedActivity) => {
      res.json({
        updatedActivity: updatedActivity,
        status: "Respondent removed successfully",
      });
    })
    .catch((err) => {
      res.status(500).json({ message: "Something went wrong", error: err });
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
};