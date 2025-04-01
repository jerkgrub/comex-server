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

    // Log the user information for debugging
    console.log('Auth middleware - User info:', {
      id: decoded.id || decoded._id,
      role: decoded.role,
      usertype: decoded.usertype
    });

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ message: 'Invalid token.' });
  }
};

// Authorization middleware
exports.isAuthorized = allowedRoles => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    // Get role from the token - check multiple possible fields
    const userRole = req.user.role || req.user.usertype;

    console.log('Authorization check:', {
      allowedRoles,
      userRole,
      user: req.user
    });

    // If role is found and is allowed, proceed
    if (userRole && allowedRoles.includes(userRole)) {
      next();
    } else if (req.user.usertype && allowedRoles.includes(req.user.usertype)) {
      // Double check usertype if role check failed
      next();
    } else {
      res.status(403).json({
        message: 'Access denied. You do not have permission to perform this action.'
      });
    }
  };
};
