const express = require('express');
const router = express.Router();
const axios = require('axios');
const Flightt = require('../models/TimetableFlight');

const getTimetable = async (req, res) => {
  try {
    const { iataCode, type } = req.query;

    
    const response = await axios.get('https://aviation-edge.com/v2/public/timetable', {
      params: {
        key: process.env.AVIATION_EDGE_API_KEY,
        iataCode,
        type,
      },
    });

    console.log(`Fetched ${response.data.length} records from Aviation Edge API`);

   
    if (Array.isArray(response.data)) {
    
      try {
        const result = await Flightt.insertMany(response.data);
        console.log(`Inserted ${result.length} records into MongoDB`);
      } catch (error) {
        console.error('Error inserting data into MongoDB:', error);
      }
    } else {
      console.error('response.data is not an array:', response.data);
    }

    res.json(response.data); 
  } catch (error) {
    console.error('Error fetching and saving data:', error);
    res.status(500).send('Server Error');
  }
};
router.get('/timetable', getTimetable);

module.exports = router;
