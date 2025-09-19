// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();

// Database connection
const connectDB = async () => {
  try {
     await mongoose.connect(process.env.MONGO_URL);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
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

// Routes - MAKE SURE THESE LINES EXIST
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/rentals", require("./routes/rentals"));    // <- This line is crucial
app.use("/api/analytics", require("./routes/analytics"));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server running', timestamp: new Date() });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
