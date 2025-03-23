const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema(
  {
    isActivated: Boolean, //for soft-deletion
    createdBy: String, // signed in user's id

    department: String,
    title: String,
    description: String,
  },
  { timestamps: true }
);

const Program = mongoose.model('Program', ProgramSchema);
module.exports = Program;
