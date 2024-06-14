import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AirportFinder.css';

const AirportFinder = () => {
  const [nearestAirports, setNearestAirports] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNearestAirports = async (lat, lng) => {
      try {
        const response = await axios.get('http://localhost:5000/api/airports/nearby', {
          params: {
            lat,
            lng,
            distance: 200, 
          },
        });
    
        setNearestAirports(response.data.filter(station => station.codeIcaoAirport !== '' && station.codeIataCity !== null));
      } catch (error) {
        console.error('Error fetching nearest airports:', error);
        setError('Failed to fetch nearest airports. Please try again later.');
      }
    };

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          fetchNearestAirports(latitude, longitude);
        }, (error) => {
          console.error('Error fetching location:', error);
          setError('Failed to fetch location. Please ensure location services are enabled.');
        });
      } else {
        console.error('Geolocation is not supported by this browser.');
        setError('Geolocation is not supported by this browser.');
      }
    };

    getLocation();
  }, []);

  return (
    <div>
      <h1>Nearest Airports from the Current Location</h1>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Airport Name</th>
            <th>City</th>
            <th>Country</th>
          </tr>
        </thead>
        <tbody>
          {nearestAirports.map((airport, index) => (
            <tr key={index}>
              <td>{airport.nameAirport}</td>
              <td>{airport.codeIataCity}</td>
              <td>{airport.nameCountry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AirportFinder;
