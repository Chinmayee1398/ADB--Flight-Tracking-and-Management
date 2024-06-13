const express = require('express');
const router = express.Router();
const axios = require('axios');
const NearbyAirport = require('../models/NearbyAirport'); // Import NearbyAirport model

// Function to fetch nearby airports
const getNearbyAirports = async (lat, lng, distance) => {
  try {
    const response = await axios.get('https://aviation-edge.com/v2/public/nearby', {
      params: {
        key: process.env.AVIATION_EDGE_API_KEY,
        lat,
        lng,
        distance
      }
    });

    // Save fetched nearby airport data to MongoDB
    await NearbyAirport.insertMany(response.data);

    return response.data;
  } catch (error) {
    console.error('Error fetching and saving data:', error);
    throw new Error('Error fetching and saving data');
  }
};

// Route for fetching nearby airports
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, distance } = req.query;

    // Call the getNearbyAirports function with the provided query parameters
    const nearbyAirports = await getNearbyAirports(lat, lng, distance);

    res.json(nearbyAirports);
  } catch (error) {
    console.error('Error fetching and saving data:', error);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
