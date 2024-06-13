const express = require('express');
const router = express.Router();
const axios = require('axios');
const Flightt = require('../models/TimetableFlight');

const getTimetable = async (req, res) => {
  try {
    const { iataCode, type } = req.query;

    // Make API request to Aviation Edge using API key from .env
    const response = await axios.get('https://aviation-edge.com/v2/public/timetable', {
      params: {
        key: process.env.AVIATION_EDGE_API_KEY,
        iataCode,
        type,
      },
    });

    console.log(`Fetched ${response.data.length} records from Aviation Edge API`);

    // Check if response.data is an array
    if (Array.isArray(response.data)) {
      // Save fetched data to MongoDB
      try {
        const result = await Flightt.insertMany(response.data);
        console.log(`Inserted ${result.length} records into MongoDB`);
      } catch (error) {
        console.error('Error inserting data into MongoDB:', error);
      }
    } else {
      console.error('response.data is not an array:', response.data);
    }

    res.json(response.data); // Respond with fetched data
  } catch (error) {
    console.error('Error fetching and saving data:', error);
    res.status(500).send('Server Error');
  }
};
router.get('/timetable', getTimetable);

module.exports = router;
