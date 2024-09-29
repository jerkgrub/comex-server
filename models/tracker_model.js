const mongoose = require("mongoose");

const TrackerSchema = new mongoose.Schema({

  // Tracker details
  

});

const Tracker = mongoose.model("Tracker", TrackerSchema);
module.exports = Tracker;
