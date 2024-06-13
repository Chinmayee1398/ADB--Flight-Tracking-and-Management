const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  iataNumber: String,
  airlineIata: String,
  departureIata: String,
  arrivalIata: String,
  status: String,
  latitude: Number,
  longitude: Number,
  scheduledDeparture: String,
  actualDeparture: String,
  scheduledArrival: String,
  estimatedArrival: String,
});

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;
