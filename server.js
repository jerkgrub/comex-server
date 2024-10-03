const express = require("express");
const cors = require("cors");
require("./config/mongo_config");  // MongoDB config

// Initialize Express app
const app = express();

// Middleware
app.use(express.json(), express.urlencoded({ extended: true }), cors());

// Import routes
const UserRoute = require("./routes/user_routes");
const ActivityRoute = require("./routes/activity_routes");
const CreditRoute = require("./routes/credit_routes");

// Mount the routes
app.use("/api/users", UserRoute);
app.use("/api/activity", ActivityRoute);
app.use("/api/credit", CreditRoute);

// Export the Express app as a module for Vercel
module.exports = app;
