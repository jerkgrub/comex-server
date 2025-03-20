const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema(
  {
    isActivated: Boolean, //for soft-deletion
    createdBy: String, // signed in user's id

    department: String,
    title: String,
    description: String,

    // approval system
    isApproved: {
      // the 2 below are department-specific
      byRepresentative: {
        approved: { type: Boolean, default: false },
        approvedOn: String, // Date of approval
        approvedBy: String // Name or ID of the approver
      },
      byDean: {
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String
      },
      byGeneralAccountingSupervisor: {
        // General Accounting Supervisor
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String
      },
      byComexCoordinator: {
        // Comex Coordinator
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String
      },
      byAcademicServicesDirector: {
        // Academic Services Director
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String
      },
      byAcademicDirector: {
        // Academic Director
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String
      },
      byExecutiveDirector: {
        // Executive Director
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String
      }
    }
  },
  { timestamps: true }
);

const Program = mongoose.model('Program', ProgramSchema);
module.exports = Program;
