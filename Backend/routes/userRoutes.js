// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = 'huaghuhgah';
const JWT_EXPIRES_IN = '7d';

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'Edasserikkudiyil' });
    if (!adminExists) {
      const admin = new User({
        username: 'Edasserikkudiyil',
        password: 'eda123',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Default admin user created: Edasserikkudiyil');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

createDefaultAdmin();



// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('\n🔐 LOGIN ATTEMPT...');
    console.log(`👤 Username: ${username}`);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    const user = await User.findOne({ username: username.trim() });
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    if (!user.isActive) {
      console.log(`❌ User inactive: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log(`✅ Login successful for: ${username}`);
    console.log(`🎫 Token generated`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Verify token route
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    console.log('\n🔍 TOKEN VERIFICATION...');
    console.log(`Token present: ${token ? 'YES' : 'NO'}`);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      console.log(`❌ Invalid user for token`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.log(`✅ Token verified for: ${user.username}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

router.post('/logout', (req, res) => {
  console.log('👋 User logged out');
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;
