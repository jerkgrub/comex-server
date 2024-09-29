const mongoose = require("mongoose");

const CreditSchema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    totalHoursRendered: {
      type: Number,
    },
    supportingDocuments: {
      type: String, // Store path to the uploaded file
    },
    facultyReflection: {
      type: String,
    },
  },
  { timestamps: true }
);

const Credit = mongoose.model("Credit", CreditSchema);
module.exports = Credit;