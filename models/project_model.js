const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    programId: { type: String, required: true }, // Foreign key reference to Program
    isApproved: { type: Boolean, default: false },
    createdBy: { type: String, required: true } // Reference to the coordinator who created it
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
