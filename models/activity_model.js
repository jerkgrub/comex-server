// /models/activity_model.js
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    // activity details
    isActivated: Boolean,

    type: String, //
    programId: String,
    projectId: String,
    organizer: String, //
    title: String,
    location: String, //
    description: String, //
    image: String,
    objectives: String,
    isVoluntaryAndUnpaid: Boolean,
    beneficiaries: String,
    registrationStart: String, //
    registrationEnd: String, //
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
      approvalDate: Date
    }
  },
  { timestamps: true }
);

const Activity = mongoose.model('Activity', ActivitySchema);
module.exports = Activity;
