const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    department: String,
    isApproved: Boolean,
    createdBy: String,
    isDeleted: { type: Boolean, default: false }, // Soft-delete flag
  },
  { timestamps: true }
);

const Program = mongoose.model("Program", ProgramSchema);
module.exports = Program;
