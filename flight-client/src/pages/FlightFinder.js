import React, { useState } from 'react';
import axios from 'axios';
import './FlightFinder.css';

const FlightFinder = () => {
  const [travelDate, setTravelDate] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureIata, setDepartureIata] = useState('');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchIataCode = async (city) => {
    try {
      const response = await axios.get('https://aviation-edge.com/v2/public/airportDatabase', {
        params: {
          key: process.env.REACT_APP_AVIATION_EDGE_API_KEY,
          nameAirport: city,
        },
      });

      if (response.data && response.data.length > 0) {
        return response.data[0].codeIataAirport;
      } else {
        throw new Error('No IATA code found for the city');
      }
    } catch (err) {
      console.error('Error fetching IATA code:', err);
      throw err;
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const depIata = await fetchIataCode(departureCity);
      setDepartureIata(depIata);
      
      const response = await axios.get('/api/futureFlights', {
        params: {
          depIata,
          date: travelDate,
        },
      });
      const filteredFlights = response.data.filter(
        (flight) => flight.arrival.iataCode === arrivalCity.toUpperCase()
      );
      setFlights(filteredFlights);
    } catch (err) {
      setError('Error fetching flights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flight-finder">
      <h1>Flight Finder</h1>
      <div className="input-group">
        <label htmlFor="travel-date">Travel Date:</label>
        <input
          type="date"
          id="travel-date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="departure-city">Departure City:</label>
        <input
          type="text"
          id="departure-city"
          value={departureCity}
          onChange={(e) => setDepartureCity(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="arrival-city">Arrival City (IATA Code):</label>
        <input
          type="text"
          id="arrival-city"
          value={arrivalCity}
          onChange={(e) => setArrivalCity(e.target.value)}
        />
      </div>
      <button classname = "searchbtn" onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search Flights'}
      </button>

      {error && <p className="error">{error}</p>}

      {flights.length > 0 && (
        <div className="flight-results">
          <h2>Flight Results</h2>
          <ul>
            {flights.map((flight, index) => (
              <li key={index}>
                <p>Flight Number: {flight.flight.number}</p>
                <p>Airline: {flight.airline.iataCode}</p>
                <p>
                  Departure: {flight.departure.iataCode} at{' '}
                  {flight.departure.scheduledTime}
                </p>
                <p>
                  Arrival: {flight.arrival.iataCode} at{' '}
                  {flight.arrival.scheduledTime}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FlightFinder;
