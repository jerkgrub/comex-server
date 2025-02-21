const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification_controller");

// # add routes for admin side notifications here

// Get all notifications for a specific user (admin side)
router.get(
  "/admin/:userId",
  notificationController.getNotificationsForUser
);

// Get all unread notifications for a specific user (admin side)
router.get(
  "/admin/:userId/unread",
  notificationController.getUnreadNotificationsForUser
);

// Get all unread notifications total count for a specific user (admin side)
router.get(
  "/admin/:userId/unread/count",
  notificationController.getUnreadNotificationsCountForUser
);

// Turn notification as read (admin side)
router.put(
  "/admin/:notificationId",
  notificationController.turnNotificationAsRead
);

// #add routes for client side notifications here

module.exports = router;
