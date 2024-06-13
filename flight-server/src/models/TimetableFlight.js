// flightModel.js
const mongoose = require('mongoose');

// Define the schema for flight data
const flighttSchema = new mongoose.Schema({
  iataNumber: String,
  airline: {
    iataCode: String,
    icaoCode: String,
    name: String
  },
  departingFrom: String,
  status: String,
  time: Date,
});

// Create and export the Flight model
module.exports = mongoose.model('Flightt', flighttSchema);