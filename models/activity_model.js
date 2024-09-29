const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema(
  {
    // activity details
    isActivated: Boolean,

    type: String, //

    organizer: String, //
    title: String,

    description: String, //
    image: String,

    isVoluntaryAndUnpaid: Boolean,
    beneficiaries: String,
    startDate: String, //
    endDate: String, //
    time: String, //
    hours: Number,
    department: String, //

    // respondents
    respondents: [{ userId: String }],

    // approvals
    adminApproval: {
      isApproved: Boolean,
      approvedBy: String,
      approvalDate: Date,
    },
  },
  { timestamps: true }
);

const Activity = mongoose.model("Activity", ActivitySchema);
module.exports = Activity;
