// server.js
require("dotenv").config(); // Load environment variables at the very top
const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./config/mongo_config"); // MongoDB config

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    // Use cached connection if available
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Database connection error", error });
  }
});

// Import routes
const userRoutes = require("./routes/user_routes");
const activityRoutes = require("./routes/activity_routes");
const creditRoutes = require("./routes/credit_routes");

// Mount the routes
app.use("/api", userRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/credit", creditRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: "An unexpected error occurred." });
});

// Export the Express app as a module for Vercel
module.exports = app;
