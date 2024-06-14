

require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const flightRoutes = require('./routes/flightRoutes');
const connectDB = require('../db'); 
const timetableRoutes = require('./routes/timetableRoutes'); 
const airportRoutes = require('./routes/airportRoutes'); 
const futureRoutes = require('./routes/futureRoutes'); 


const app = express();
const port = process.env.PORT || 5000;


connectDB();


app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());


app.use('/api/flights', flightRoutes);


app.use('/api/timetable', timetableRoutes); 


app.use('/api/airports', airportRoutes); 


app.use('/api/future-flights', futureRoutes);



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
