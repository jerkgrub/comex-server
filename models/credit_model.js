const mongoose = require("mongoose");

const CreditSchema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: function () {
        return this.isRegisteredEvent === true;
      },
    },
    isRegisteredEvent: {
      type: Boolean,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true, // Type is required for both registered and non-registered events
    },
    title: {
      type: String,
      required: function () {
        return this.isRegisteredEvent === false;
      },
    },
    isVoluntary: {
      type: Boolean,
      required: function () {
        return this.isRegisteredEvent === false;
      },
    },
    beneficiaries: {
      type: String,
      required: function () {
        return this.isRegisteredEvent === false;
      },
    },
    startDate: {
      type: Date,
      required: function () {
        return this.isRegisteredEvent === false;
      },
    },
    endDate: {
      type: Date,
      required: function () {
        return this.isRegisteredEvent === false;
      },
    },
    totalHoursRendered: {
      type: Number,
      required: true,
    },
    supportingDocuments: {
      type: String, // Store URL or path to the uploaded file
    },
    facultyReflection: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Credit = mongoose.model("Credit", CreditSchema);
module.exports = Credit;