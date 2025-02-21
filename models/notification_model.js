// models/notification_model.js
const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    type: { type: String, enum: ["info", "warning", "error"], default: "info" },
    read: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed }, // Flexible field for additional data
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
