//server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectToDatabase = require('./config/mongo_config');
const Otp = require('./Otp'); // Import Otp
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection error', error });
  }
});

// Import routes
const userRoutes = require('./routes/user_routes');
const creditRoutes = require('./routes/credit_routes');
const programRoutes = require('./routes/program_routes');
const projectRoutes = require('./routes/project_routes');
const notificationRoutes = require('./routes/notification_routes');
const contentRoutes = require('./routes/content_routes');
const formRoutes = require('./routes/form_routes');
const testRoutes = require('./practice/test_controller');

// user
app.use('/api', userRoutes);
app.use('/api/test', testRoutes);
app.use('/api/notification', notificationRoutes);

// initiatives
app.use('/api/program', programRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/credit', creditRoutes);

// forms
app.use('/api/form', formRoutes);

// content
app.use('/api/content', contentRoutes);

// OTP Routes
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log('[DEBUG] Received forgot-password request for email:', email);

  try {
    await Otp.sendOtp(email);
    console.log('[DEBUG] OTP sent successfully to email:', email);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[DEBUG] Error in forgot-password endpoint:', error);

    // Check if it's an email validation error
    if (error.message === 'Invalid email format or domain') {
      return res.status(400).json({
        success: false,
        message:
          'Invalid email format or domain. Please use your institutional email ending with nu-moa.edu.ph.'
      });
    }

    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

app.post('/api/auth/validate-otp', (req, res) => {
  const { email, otp } = req.body;
  console.log('[DEBUG] Received validate-otp request for email:', email, 'OTP:', otp);

  const isValid = Otp.validateOtp(email, otp);
  console.log('[DEBUG] OTP validation result for email:', email, 'Result:', isValid);

  if (isValid) {
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }
});

// Conditionally start the server for local testing
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running locally on port ${PORT}`);
  });
}

module.exports = app;
