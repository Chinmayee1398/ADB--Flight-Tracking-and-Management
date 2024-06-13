// flightRoutes.js
const express = require('express');
const { getFlightInfo } = require('../controllers/flightController');

const router = express.Router();

// Define the route for the /api/flights endpoint
router.get('/', getFlightInfo);

module.exports = router;
