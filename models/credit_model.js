const mongoose = require("mongoose");

const CreditSchema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
    },
    isRegisteredEvent: {
      type: Boolean,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
    },
    title: {
      type: String,
      // Conditional requirement based on isRegisteredEvent
    },
    isVoluntary: {
      type: Boolean,
      // Conditional requirement based on isRegisteredEvent
    },
    beneficiaries: {
      type: String,
      // Conditional requirement based on isRegisteredEvent
    },
    startDate: {
      type: Date,
      // Conditional requirement based on isRegisteredEvent
    },
    endDate: {
      type: Date,
      // Conditional requirement based on isRegisteredEvent
    },
    totalHoursRendered: {
      type: Number,
    },
    supportingDocuments: {
      type: String, // URL or path to the uploaded file
    },
    facultyReflection: {
      type: String,
    },
    // New Fields for Approval/Rejection
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming approvers are also users
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

const Credit = mongoose.model("Credit", CreditSchema);
module.exports = Credit;
