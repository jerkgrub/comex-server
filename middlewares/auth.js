// middlewares/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

const auth = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // The token is expected to be in the format 'Bearer token', so split it
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  try {
    // Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'COMEX2024'); // Use your secret key
    req.user = decoded; // Attach the decoded token data to the request object
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token.' });
  }
};

module.exports = auth;
