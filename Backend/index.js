// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();

// Import auth middleware
const authMiddleware = require('./middleware/auth');

// ✅ FIXED: Updated Database connection with proper error handling
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // ✅ REMOVE DEPRECATED OPTIONS
    await mongoose.connect(process.env.MONGO_URL, {
      // Removed: useNewUrlParser: true,     // Deprecated
      // Removed: useUnifiedTopology: true,  // Deprecated
      
      // ✅ MODERN CONNECTION OPTIONS
      serverSelectionTimeoutMS: 30000, // 30 seconds (increased from 10s)
      socketTimeoutMS: 45000,           // 45 seconds
      connectTimeoutMS: 30000,          // 30 seconds
      maxPoolSize: 10,                  // Maximum number of connections
      family: 4,                        // Force IPv4
      
      // ✅ MongoDB Server API version
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Connected to: ${mongoose.connection.host}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // ✅ BETTER ERROR HANDLING - Don't exit in production immediately
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Retrying connection in 10 seconds...');
      setTimeout(() => {
        connectDB();
      }, 10000);
    } else {
      process.exit(1);
    }
  }
};

// ✅ MONGOOSE CONNECTION EVENT HANDLERS
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
  
  // ✅ AUTO-RECONNECT in production
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Attempting to reconnect...');
    connectDB();
  }
});

// ✅ GRACEFUL SHUTDOWN
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT. Closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// ✅ START CONNECTION
connectDB();

// ✅ CORS and middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'https://rental-xi-eight.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ REQUEST LOGGING MIDDLEWARE
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.originalUrl}`);
  
  // ✅ LOG REQUEST BODY FOR POST/PUT (for debugging)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    console.log(`📝 Request body:`, JSON.stringify(req.body, null, 2));
  }
  
  next();
});

// ✅ FIXED: Correct auth routes import
const authRoutes = require('./routes/auth'); // ✅ CHANGED FROM userRoutes to auth

// ✅ ROOT ROUTE (Fix 404 on "/")
app.get('/', (req, res) => {
  res.json({
    message: '🏠 Rental Management API Server',
    status: 'Running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      products: '/api/products/*',
      rentals: '/api/rentals/*',
      analytics: '/api/analytics/*',
      health: '/api/health'
    }
  });
});

// ✅ PUBLIC ROUTES (No authentication required)
app.use('/api/auth', authRoutes);

// ✅ HEALTH CHECK ROUTE
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    database: {
      status: statusMap[dbStatus],
      host: mongoose.connection.host || 'not connected'
    },
    server: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// ✅ PROTECTED ROUTES (Authentication required)
console.log('🔐 Setting up protected routes...');

try {
  app.use('/api/products', authMiddleware, require('./routes/productRoutes'));
  console.log('   ✅ /api/products/* - Protected');
} catch (error) {
  console.log('   ⚠️ /api/products/* - Route file not found');
}

try {
  app.use('/api/rentals', authMiddleware, require('./routes/rentals'));
  console.log('   ✅ /api/rentals/* - Protected');
} catch (error) {
  console.log('   ⚠️ /api/rentals/* - Route file not found');
}

try {
  app.use('/api/analytics', authMiddleware, require('./routes/analytics'));
  console.log('   ✅ /api/analytics/* - Protected');
} catch (error) {
  console.log('   ⚠️ /api/analytics/* - Route file not found');
}

// ✅ GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err);
  
  // ✅ MONGOOSE ERRORS
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value'
    });
  }
  
  // ✅ DEFAULT ERROR
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ✅ 404 HANDLER (Must be last)
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/signup',
      'GET /api/auth/verify',
      'POST /api/auth/logout'
    ]
  });
});

// ✅ START SERVER
const PORT = process.env.PORT || 8000;

const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log('\n🚀 SERVER STARTED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`📍 Server running on port: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`🏠 API Root: http://localhost:${PORT}/`);
    console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50));
    console.log('\n🔐 AUTHENTICATION ROUTES:');
    console.log('   📝 POST /api/auth/login');
    console.log('   📝 POST /api/auth/signup');
    console.log('   🔍 GET  /api/auth/verify');
    console.log('   👋 POST /api/auth/logout');
    console.log('\n🛡️ PROTECTED ROUTES:');
    console.log('   🏷️  /api/products/* (requires auth)');
    console.log('   🏠 /api/rentals/* (requires auth)');
    console.log('   📊 /api/analytics/* (requires auth)');
    console.log('='.repeat(50));
  });

  // ✅ SERVER ERROR HANDLING
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', err);
    }
  });

  return server;
};

// ✅ START THE SERVER
startServer();

module.exports = app;
