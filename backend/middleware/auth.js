const jwt = require('jsonwebtoken');

// Required authentication middleware
const auth = (req, res, next) => {
  try {
    // Check for token in both cookies and Authorization header
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-for-development');
    
    // Map userId to id for consistency with other parts of the app
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      ...decoded
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Optional authentication middleware - allows both authenticated and anonymous users
const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-for-development');
      req.user = {
        id: decoded.userId,
        userId: decoded.userId,
        ...decoded
      };
    }
    // If no token, req.user will be undefined, but we continue
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // If token is invalid, continue without user
    next();
  }
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth; 