// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'huaghuhgah';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    console.log(`\n🔐 AUTH CHECK: ${req.method} ${req.originalUrl}`);
    console.log(`🎫 Token present: ${token ? 'YES' : 'NO'}`);

    if (!token) {
      console.log('❌ ACCESS DENIED: No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      console.log('❌ ACCESS DENIED: Invalid user or inactive account');
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.log(`✅ ACCESS GRANTED for: ${user.username}`);
    req.user = user;
    next();
  } catch (error) {
    console.log(`❌ TOKEN ERROR: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = authMiddleware;
