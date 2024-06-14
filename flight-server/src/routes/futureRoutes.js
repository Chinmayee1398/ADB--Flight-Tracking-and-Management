const express = require('express');
const router = express.Router();
const futureController = require('../controllers/futureController');

router.get('/fetch-flights', futureController.fetchAndStoreFlights);
router.get('/stored-flights', futureController.getStoredFlights);

module.exports = router;
