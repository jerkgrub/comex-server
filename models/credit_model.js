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
    },
    isVoluntary: {
      type: Boolean,
    },
    beneficiaries: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    totalHoursRendered: {
      type: Number,
    },
    supportingDocuments: {
      type: String, // Store URL or path to the uploaded file
    },
    facultyReflection: {
      type: String,
    },
  },
  { timestamps: true }
);

const Credit = mongoose.model("Credit", CreditSchema);
module.exports = Credit;