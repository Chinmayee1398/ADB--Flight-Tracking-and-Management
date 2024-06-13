const mongoose = require('mongoose');

const nearbyAirportSchema = new mongoose.Schema({
  iataCode: String,
  icaoCode: String,
  name: String,
  location: {
    lat: Number,
    lng: Number,
  },
  city: String,
  country: String,
  distance: Number,
});

module.exports = mongoose.model('NearbyAirport', nearbyAirportSchema);
