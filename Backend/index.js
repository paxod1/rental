// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();

// Import auth middleware
const authMiddleware = require('./middleware/auth');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10s timeout
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};


connectDB();

// CORS and middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://rental-xi-eight.vercel.app'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ STEP 1: CREATE PROPER AUTH ROUTES
// Create this file: routes/auth.js
const authRoutes = require('./routes/userRoutes'); // NOT userRoutes

// ✅ STEP 2: PUBLIC ROUTES (No token required)
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server running', timestamp: new Date() });
});

// ✅ STEP 3: PROTECTED ROUTES (Token verification required)
app.use('/api/products', authMiddleware, require('./routes/productRoutes'));
app.use('/api/rentals', authMiddleware, require('./routes/rentals'));
app.use('/api/analytics', authMiddleware, require('./routes/analytics'));

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('🔐 Authentication middleware applied to:');
  console.log('   - /api/products/*');
  console.log('   - /api/rentals/*');
  console.log('   - /api/analytics/*');
});
