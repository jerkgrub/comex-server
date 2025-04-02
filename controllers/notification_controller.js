// controllers/user_controller.js (inside approveUser)
const Notification = require('../models/notification_model');
const User = require('../models/user_model');
const Project = require('../models/project_model');

// # FOR ADMIN SIDE NOTIFICATIONS

// Get all notifications for a specific user
const getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find all notifications for the user, sorted by creation date (newest first)
    const notifications = await Notification.find({ recipient: userId }).sort({
      createdAt: -1
    });

    if (!notifications) {
      return res.status(404).json({ message: 'No notifications found' });
    }

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Get all unread notifications for a specific user
const getUnreadNotificationsForUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find all unread notifications for the user, sorted by creation date (newest first)
    const unreadNotifications = await Notification.find({
      recipient: userId,
      read: false
    }).sort({
      createdAt: -1
    });

    if (!unreadNotifications) {
      return res.status(404).json({ message: 'No unread notifications found' });
    }

    res.status(200).json({ notifications: unreadNotifications });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      message: 'Error fetching unread notifications',
      error: error.message
    });
  }
};

// Get count of unread notifications for a specific user
const getUnreadNotificationsCountForUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Count unread notifications for the user
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    res.status(200).json({ count: unreadCount });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({
      message: 'Error counting unread notifications',
      error: error.message
    });
  }
};

// Mark a notification as read
const turnNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};

// Notify existing users with a usertype of "Admin" & "ComEx Coordinator" about newly created user
const notifyAdminsAboutNewUser = async newUser => {
  try {
    // Find all users with usertype Admin or ComEx Coordinator
    const adminsAndCoordinators = await User.find({
      usertype: { $in: ['Admin', 'ComEx Coordinator'] },
      isApproved: true,
      isActivated: true
    });

    // Create notifications for each admin/coordinator
    const notifications = adminsAndCoordinators.map(admin => ({
      recipient: admin._id,
      message: `New user registration: ${newUser.firstName} ${newUser.lastName} (${newUser.usertype})`,
      type: 'info',
      data: {
        userId: newUser._id,
        userType: newUser.usertype,
        name: `${newUser.firstName} ${newUser.lastName}`,
        notificationType: 'new_user'
      }
    }));

    // Insert all notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating admin notifications:', error);
  }
};

// Notify existing users with a usertype of "Admin" & "ComEx Coordinator" about form response
const notifyAdminsAboutFormResponse = async (formResponse, form, user, projectTitle = null) => {
  try {
    // Find all users with usertype Admin or ComEx Coordinator
    const adminsAndCoordinators = await User.find({
      usertype: { $in: ['Admin', 'ComEx Coordinator'] },
      isApproved: true,
      isActivated: true
    });

    let message = '';
    if (projectTitle) {
      message = `New form response: ${user.firstName} ${user.lastName} submitted "${form.title}" for project "${projectTitle}"`;
    } else {
      message = `New form response: ${user.firstName} ${user.lastName} submitted "${form.title}"`;
    }

    // Create notifications for each admin/coordinator
    const notifications = adminsAndCoordinators.map(admin => ({
      recipient: admin._id,
      message: message,
      type: 'info',
      data: {
        responseId: formResponse._id,
        formId: form._id,
        formName: form.title,
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        projectId: formResponse.projectId || null,
        projectTitle: projectTitle || null,
        notificationType: 'form_response'
      }
    }));

    // Insert all notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating form response notifications:', error);
  }
};

// Notify users when added to a project workplan
const notifyUserAboutWorkplanAssignment = async (project, workplanItem) => {
  try {
    if (!workplanItem.espUserId) {
      console.error('No user ID provided for workplan notification');
      return;
    }

    const user = await User.findById(workplanItem.espUserId);
    if (!user) {
      console.error(`User not found with ID: ${workplanItem.espUserId}`);
      return;
    }

    const notification = {
      recipient: workplanItem.espUserId,
      message: `You've been added to the workplan for project "${project.title}" as ${workplanItem.role} (${workplanItem.activity}). Please sign the workplan.`,
      type: 'info',
      data: {
        projectId: project._id,
        title: project.title,
        role: workplanItem.role,
        activity: workplanItem.activity,
        hoursReceived: workplanItem.hoursReceived,
        notificationType: 'workplan_assignment'
      }
    };

    await Notification.create(notification);
  } catch (error) {
    console.error('Error creating workplan assignment notification:', error);
  }
};

// Notify project creator about workplan signing
const notifyProjectCreatorAboutWorkplanSigning = async (project, signerName, activity, role) => {
  try {
    if (!project.proposedBy) {
      console.error('No project creator found for notification');
      return;
    }

    const notification = {
      recipient: project.proposedBy,
      message: `Your project "${project.title}" has a new workplan signature from ${signerName} (${role}) for ${activity}`,
      type: 'info',
      data: {
        projectId: project._id,
        title: project.title,
        signerName,
        activity,
        role,
        notificationType: 'workplan_signing'
      }
    };

    await Notification.create(notification);
  } catch (error) {
    console.error('Error creating workplan signing notification:', error);
  }
};

// Notify project creator about approval
const notifyProjectCreatorAboutApproval = async (project, approvalType, approverName) => {
  try {
    if (!project.proposedBy) {
      console.error('No project creator found for notification');
      return;
    }

    // Make approval type more readable
    const readableApprovalType = approvalType
      .replace('by', '')
      .split(/(?=[A-Z])/)
      .join(' ')
      .trim();

    const notification = {
      recipient: project.proposedBy,
      message: `Your project "${project.title}" has been approved by ${readableApprovalType}: ${approverName}`,
      type: 'info',
      data: {
        projectId: project._id,
        title: project.title,
        approverName,
        approvalType,
        notificationType: 'project_approval'
      }
    };

    await Notification.create(notification);
  } catch (error) {
    console.error('Error creating approval notification:', error);
  }
};

module.exports = {
  notifyAdminsAboutNewUser,
  notifyAdminsAboutFormResponse,
  notifyUserAboutWorkplanAssignment,
  getNotificationsForUser,
  getUnreadNotificationsForUser,
  getUnreadNotificationsCountForUser,
  turnNotificationAsRead,
  notifyProjectCreatorAboutWorkplanSigning,
  notifyProjectCreatorAboutApproval
};
