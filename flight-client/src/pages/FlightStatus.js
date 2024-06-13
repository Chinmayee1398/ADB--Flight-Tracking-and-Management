//flightStatus.js

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './FlightStatus.css'; // Import the CSS file
import L from 'leaflet';

// Fix default marker icon issue with Webpack and Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function FlightStatus() {
  const [flightNum, setFlightNum] = useState('');
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFlightData = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/flights?flightNum=${flightNum}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data) {
        setFlightData(data);
      } else {
        setFlightData(null); // No flight data found
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="FlightStatus">
      <h1>Flight Tracker</h1>
      <form onSubmit={fetchFlightData}>
        <input
          type="text"
          value={flightNum}
          onChange={(e) => setFlightNum(e.target.value)}
          placeholder="Enter flight number"
        />
        <button type="submit">Track Flight</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {flightData ? (
        <div>
          <h2>Flight Information</h2>
          <table>
            <thead>
              <tr>
                <th>Flight Number</th>
                <th>Airline</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Status</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Scheduled Departure</th>
                <th>Actual Departure</th>
                <th>Scheduled Arrival</th>
                <th>Estimated Arrival</th>
              
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{flightData.iataNumber}</td>
                <td>{flightData.airlineIata}</td>
                <td>{flightData.departureIata}</td>
                <td>{flightData.arrivalIata}</td>
                <td>{flightData.status}</td>
                <td>{flightData.latitude}</td>
                <td>{flightData.longitude}</td>
                <td>{flightData.scheduledDeparture}</td>
                <td>{flightData.actualDeparture}</td>
                <td>{flightData.scheduledArrival}</td>
                <td>{flightData.estimatedArrival}</td>
              
              </tr>
            </tbody>
          </table>

          <MapContainer center={[flightData.latitude, flightData.longitude]} zoom={6} style={{ height: "400px", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {flightData.latitude && flightData.longitude && (
              <Marker position={[flightData.latitude, flightData.longitude]}>
                <Popup>
                  Flight {flightData.iataNumber} is currently {flightData.status}.
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      ) : (
        <p>No flight data available</p>
      )}
    </div>
  );
}

export default FlightStatus;
