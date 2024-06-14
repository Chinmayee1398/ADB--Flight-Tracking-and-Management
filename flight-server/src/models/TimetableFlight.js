
const mongoose = require('mongoose');


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