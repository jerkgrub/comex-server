const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    isApproved: { type: Boolean, default: false },
    createdBy: { type: String, required: true }, // Reference to the coordinator who created it
  },
  { timestamps: true }
);

const Program = mongoose.model("Program", ProgramSchema);
module.exports = Program;