const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  icao: { type: String, required: true },
  type: { type: String, required: true },
  data: { type: Object, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Weather = mongoose.model('Weather', weatherSchema);

module.exports = Weather;
