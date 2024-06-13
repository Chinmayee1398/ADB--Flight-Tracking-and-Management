const Flight = require('../models/Flight');

const getTimetable = async (req, res) => {
  try {
    const { flightNumber, airline, departingFrom, status, fromTime, toTime } = req.query;

    // Query MongoDB for flight data
    const flights = await Flight.find({
      flightNumber,
      airline,
      departingFrom,
      status,
      time: { $gte: new Date(fromTime), $lte: new Date(toTime) }
    });

    res.json(flights);
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getTimetable,
};