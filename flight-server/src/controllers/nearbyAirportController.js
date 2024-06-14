const axios = require('axios');
const NearbyAirport = require('../models/NearbyAirport');

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

   
    await NearbyAirport.insertMany(response.data);

    return response.data;
  } catch (error) {
    console.error('Error fetching data from Aviation Edge API:', error);
    throw new Error('Failed to fetch nearby airports');
  }
};

module.exports = {
  getNearbyAirports,
};
