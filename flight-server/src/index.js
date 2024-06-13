//index.js

require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const flightRoutes = require('./routes/flightRoutes');
const connectDB = require('../db'); // Assuming this connects to MongoDB

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// Define route for /api/flights
app.use('/api/flights', flightRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
