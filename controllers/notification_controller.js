// controllers/user_controller.js (inside approveUser)
const Notification = require("../models/notification_model");
const User = require("../models/user_model");

// # FOR ADMIN SIDE NOTIFICATIONS

// Notify existing users with a usertype of "Admin" & "ComEx Coordinator" about newly created user
const notifyAdminsAboutNewUser = async (newUser) => {
  try {
    // Find all users with usertype Admin or ComEx Coordinator
    const adminsAndCoordinators = await User.find({
      usertype: { $in: ["Admin", "ComEx Coordinator"] },
      isApproved: true,
      isActivated: true,
    });

    // Create notifications for each admin/coordinator
    const notifications = adminsAndCoordinators.map((admin) => ({
      recipient: admin._id,
      message: `New user registration: ${newUser.firstName} ${newUser.lastName} (${newUser.usertype})`,
      type: "info",
      data: {
        userId: newUser._id,
        userType: newUser.usertype,
        name: `${newUser.firstName} ${newUser.lastName}`,
      },
    }));

    // Insert all notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error("Error creating admin notifications:", error);
  }
};

//  # FOR CLIENT SIDE NOTIFICATIONS
// ... after successfully approving a user:
// await Notification.create({
//   recipient: user._id,
//   message: "Your account has been approved!",
//   type: "info"
// });

module.exports = {
  notifyAdminsAboutNewUser,
};
