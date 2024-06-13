// flight-server/src/routes/flightRoutes.js

const express = require('express');
const futureController = require('../controllers/futureController');

const router = express.Router();

router.get('/futureFlights', futureController.getFutureFlights);

module.exports = router;