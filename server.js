const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const uri = 'mongodb+srv://jcjeffancelvaz:6TGLgOSNzSWptvNP@weather.sbnmk0t.mongodb.net/weatherDB?retryWrites=true&w=majority';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define a schema and model
const weatherSchema = new mongoose.Schema({
    station: String,
    time: String,
    temperature: Number,
    dewpoint: Number,
    relative_humidity: Number,
    wind_speed: Number,
    wind_direction: String,
    visibility: Number,
    altimeter: Number,
    wx_codes: [String],
    clouds: [String],
    raw: String,
    flight_rules: String
});

const Weather = mongoose.model('Weather', weatherSchema);

// Endpoint to save weather data
app.post('/saveWeather', async (req, res) => {
    console.log('Received data:', req.body); // Log received data
    
    // Check if data exists in the database
    const cachedData = await Weather.findOne({ station: req.body.station, time: req.body.time.dt }).exec();

    if (cachedData) {
        console.log('Weather data found in cache');
        res.status(200).json(cachedData); // Return cached data
    } else {
        // Preprocess data
        const weatherData = {
            station: req.body.station,
            time: req.body.time.dt,
            temperature: parseInt(req.body.temperature.value),
            dewpoint: parseInt(req.body.dewpoint.value),
            relative_humidity: parseFloat(req.body.relative_humidity), // Parse as float
            wind_speed: parseInt(req.body.wind_speed.value),
            wind_direction: req.body.wind_direction.value,
            visibility: parseInt(req.body.visibility.value),
            altimeter: parseInt(req.body.altimeter.value),
            wx_codes: req.body.wx_codes.map(code => code.value),
            clouds: req.body.clouds.map(cloud => cloud.repr)
            // Add other fields as needed
        };

        try {
            // Save preprocessed weather data
            await Weather.create(weatherData);
            console.log('Weather data saved'); // Log success message
            res.status(200).json(weatherData); // Return saved data
        } catch (error) {
            console.error('Error saving weather data:', error); // Log error message
            res.status(500).send('Error saving weather data');
        }
    }
});

// Serve static files (your HTML, CSS, JS files)
app.use(express.static('public'));

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
