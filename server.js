const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./config/mongo_config");  // MongoDB config

// Initialize Express app
const app = express();

// Middleware
app.use(express.json(), express.urlencoded({ extended: true }), cors());

// Import routes
const UserRoute = require("./routes/user_routes");
const ActivityRoute = require("./routes/activity_routes");
const CreditRoute = require("./routes/credit_routes");

// Use the MongoDB connection before any routes
app.use(async (req, res, next) => {
  try {
    await connectToDatabase(); // Ensure connection to the database
    next();
  } catch (error) {
    res.status(500).json({ message: "Database connection error", error });
  }
});

// Mount the routes
app.use("/api/users", UserRoute);
app.use("/api/activity", ActivityRoute);
app.use("/api/credit", CreditRoute);

// Export the Express app as a module for Vercel
module.exports = app;
