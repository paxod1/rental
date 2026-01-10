// index.js - ADD WHATSAPP STARTUP
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require('dotenv').config();

// ✅ Force server to use IST timezone
process.env.TZ = 'Asia/Kolkata';

// ✅ Alternative: Log current server time for debugging
console.log('🕐 Server Current Time:', new Date().toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'full',
  timeStyle: 'full'
}));

const app = express();

// ✅ Import auth router + admin creation function
const { router: authRoutes, createDefaultAdmin } = require('./routes/userRoutes');

// ✅ Import your auth middleware
const authMiddleware = require('./middleware/auth');

// ✅ IMPORT WHATSAPP SERVICE
const whatsappService = require('./services/whatsappService');

// ✅ Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// ✅ Connect DB first, then create default admin once
connectDB().then(() => {
  console.log('🚀 DB ready — creating default admin...');
  createDefaultAdmin();
});

// ✅ CORS and middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://rental-xi-eight.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Public routes (No token required)
app.use('/api/auth', authRoutes);

// ✅ Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server running', timestamp: new Date() });
});

// ✅ Protected routes (Require token)
app.use('/api/products', authMiddleware, require('./routes/productRoutes'));
app.use('/api/rentals', authMiddleware, require('./routes/rentals'));
app.use('/api/analytics', authMiddleware, require('./routes/analytics'));
const whatsappRoutes = require('./routes/whatsapp');
app.use('/api/whatsapp', whatsappRoutes);

// ✅ 404 fallback
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 8000;

// ✅ ADD WHATSAPP STARTUP HERE
// index.js - CLEAN ULTRAMSG STARTUP
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log('🔐 Authentication middleware applied to protected routes');

  // ✅ ULTRAMSG WHATSAPP STARTUP
  try {
    console.log('\n🟢 Starting UltraMsg WhatsApp service...');
    await whatsappService.start();
    console.log('🎉 WhatsApp billing system ready!');
  } catch (error) {
    console.error('❌ WhatsApp service failed:', error.message);
    console.log('   You can still use your rental system - WhatsApp will be unavailable');
  }
});
