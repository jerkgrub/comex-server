const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: String,
    programId: String, // Foreign key reference to Program
    isApproved: Boolean,
    createdBy: String // Reference to the coordinator who created it
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
