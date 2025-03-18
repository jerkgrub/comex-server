// models/activity_model.js
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    // Existing fields
    isActivated: { type: Boolean, default: true },
    type: { type: String, required: true },
    programId: String,
    projectId: String,
    organizer: String,
    title: { type: String, required: true },
    location: String,
    description: String,
    image: String,
    objectives: String,
    isVoluntaryAndUnpaid: Boolean,
    beneficiaries: String,
    registrationStart: Date,
    registrationEnd: Date,
    startDate: Date,
    endDate: Date,
    startTime: String,
    endTime: String,
    hours: Number,
    department: String,

    // Updated respondents structure
    respondents: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        activityForm: { type: mongoose.Schema.Types.ObjectId, ref: 'ActivityForm' },
        response: { type: mongoose.Schema.Types.ObjectId, ref: 'Response' },
        _id: false
      }
    ],

    // Existing approval field remains for backward compatibility
    isApproved: { type: Boolean, default: null }
  },
  { timestamps: true }
);

const Activity = mongoose.model('Activity', ActivitySchema);
module.exports = Activity;
