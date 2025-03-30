const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification_controller');

// Get all notifications for a specific user
router.get('/:userId', notificationController.getNotificationsForUser);

// Get all unread notifications for a specific user
router.get('/:userId/unread', notificationController.getUnreadNotificationsForUser);

// Get all unread notifications total count for a specific user
router.get('/:userId/unread/count', notificationController.getUnreadNotificationsCountForUser);

// Turn notification as read
router.put('/:notificationId', notificationController.turnNotificationAsRead);

module.exports = router;
