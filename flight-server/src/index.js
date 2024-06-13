//index.js

require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const flightRoutes = require('./routes/flightRoutes');
const connectDB = require('../db'); // Assuming this connects to MongoDB
const timetableRoutes = require('./routes/timetableRoutes'); // Import flightRoutes
const airportRoutes = require('./routes/airportRoutes'); // Import airportRoutes
const futureRoutes = require('./routes/futureRoutes'); // Import futureRoutes


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

// Use flightRoutes for any requests that start with /api/flights
app.use('/api/timetable', timetableRoutes); // Use flightRoutes middleware here

// Use airportRoutes for any requests that start with /api/airports
app.use('/api/airports', airportRoutes); // Use airportRoutes middleware here

app.use('/api', futureRoutes); // Use futureRoutes middleware here


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
