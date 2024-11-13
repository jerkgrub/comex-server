const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    isApproved: Boolean,
    createdBy: String,
  },
  { timestamps: true }
);

const Program = mongoose.model("Program", ProgramSchema);
module.exports = Program;