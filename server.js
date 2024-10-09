require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./config/mongo_config");
const Otp = require('./Otp'); // Import Otp

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
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

app.use("/api", userRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/credit", creditRoutes);

// OTP Routes
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    await Otp.sendOtp(email);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

app.post('/auth/validate-otp', (req, res) => {
  const { email, otp } = req.body;

  const isValid = Otp.validateOtp(email, otp);
  if (isValid) {
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: "An unexpected error occurred." });
});

module.exports = app;