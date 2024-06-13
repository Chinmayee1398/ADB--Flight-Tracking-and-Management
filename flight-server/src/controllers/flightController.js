//flightCOntroller.js
const axios = require('axios');
const Flight = require('../models/Flight');
const { createClient } = require('redis');

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

(async () => {
  await redisClient.connect();
})();

const getFlightInfo = async (req, res) => {
  try {
    const { flightNum } = req.query;

    // Try to get flight data from Redis
    const cachedFlightData = await redisClient.get(flightNum);
    if (cachedFlightData) {
      return res.json(JSON.parse(cachedFlightData));
    }

    // Fetch flight data from Aviation Edge API
    const flightResponse = await axios.get('https://aviation-edge.com/v2/public/flights', {
      params: {
        key: process.env.AVIATION_EDGE_API_KEY,
        flightNum: flightNum,
      },
    });

    const flightData = flightResponse.data[0];

    if (flightData) {
      // Fetch timetable data from Aviation Edge API
      const timetableResponse = await axios.get('https://aviation-edge.com/v2/public/timetable', {
        params: {
          key: process.env.AVIATION_EDGE_API_KEY,
          flight_num: flightNum,
          type: 'arrival',
        },
      });

      const timetableData = timetableResponse.data[0];

      const flight = new Flight({
        iataNumber: flightData.flight.iataNumber,
        airlineIata: flightData.airline.iataCode,
        departureIata: flightData.departure.iataCode,
        arrivalIata: flightData.arrival.iataCode,
        status: flightData.status,
        latitude: flightData.geography.latitude,
        longitude: flightData.geography.longitude,
        scheduledDeparture: timetableData.departure.scheduledTime,
        actualDeparture: timetableData.departure.actualTime,
        scheduledArrival: timetableData.arrival.scheduledTime,
        estimatedArrival: timetableData.arrival.estimatedTime,
      });

      // Save flight data to MongoDB
      await flight.save();

      // Store flight data in Redis and set an expiration time (e.g., 3600 seconds = 1 hour)
      await redisClient.set(flightNum, JSON.stringify(flight), {
        EX: 3600
      });

      res.json(flight); // Send the flight data back to the client
    } else {
      res.status(404).json({ error: 'Flight not found' });
    }
  } catch (error) {
    console.error('Error fetching flight data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getFlightInfo,
};
