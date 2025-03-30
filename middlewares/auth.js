// middlewares/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

// Authentication middleware
exports.isAuthenticated = (req, res, next) => {
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

// Authorization middleware
exports.isAuthorized = allowedRoles => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const { role } = req.user;

    if (allowedRoles.includes(role)) {
      next();
    } else {
      res.status(403).json({
        message: 'Access denied. You do not have permission to perform this action.'
      });
    }
  };
};
