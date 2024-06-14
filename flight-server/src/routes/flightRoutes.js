
const express = require('express');
const { getFlightInfo } = require('../controllers/flightController');

const router = express.Router();


router.get('/', getFlightInfo);

module.exports = router;
