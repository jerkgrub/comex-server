const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    isActivated: Boolean, //for soft-deletion
    createdBy: String, // signed in user's id
    programId: String, // Foreign key reference to Program

    title: String,
    description: String,

    // approval system
    isApproved: {
      // the 2 below are department-specific
      byRepresentative: Boolean,
      byDean: Boolean,

      // the 5 below are universal
      byGeneralAccountingSupervisor: Boolean, // General Accounting Supervisor
      byComexCoordinator: Boolean, // Comex Coordinator
      byAcademicServicesDirector: Boolean, // Academic Services Director
      byAcademicDirector: Boolean, // Academic Director
      byExecutiveDirector: Boolean // Executive Director
    }
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
