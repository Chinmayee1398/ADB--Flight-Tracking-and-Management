import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AirportInfo.css';

const AirportInfo = () => {
  const [arrivalData, setArrivalData] = useState([]);
  const [departureData, setDepartureData] = useState([]);
  const [selectedIataCode, setSelectedIataCode] = useState('FRA');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) {
      const fetchAirportData = async () => {
        try {
          const now = new Date(); 
          const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000)); 
          const currentTime = now.toISOString();
          const oneHourLaterTime = oneHourLater.toISOString();

        
          const arrivalResponse = await axios.get('http://localhost:5000/api/timetable/timetable', {
            params: {
              iataCode: selectedIataCode,
              type: 'arrival',
              startTime: currentTime, 
              endTime: oneHourLaterTime, 
            },
          });

          const filteredArrivalData = arrivalResponse.data.filter(flight => {
            const flightTime = new Date(flight.departure.scheduledTime);
            return flightTime >= now && flightTime <= oneHourLater;
          });

          setArrivalData(filteredArrivalData);

          
          const departureResponse = await axios.get('http://localhost:5000/api/timetable/timetable', {
            params: {
              iataCode: selectedIataCode,
              type: 'departure',
              startTime: currentTime, 
              endTime: oneHourLaterTime, 
            },
          });

          const filteredDepartureData = departureResponse.data.filter(flight => {
            const flightTime = new Date(flight.arrival.scheduledTime);
            return flightTime >= now && flightTime <= oneHourLater;
          });

          setDepartureData(filteredDepartureData);
        } catch (error) {
          console.error('Error fetching airport data:', error);
        }
      };

      fetchAirportData();
    }
  }, [selectedIataCode, submitted]);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const renderArrivalTable = () => (
    <table>
      <thead>
        <tr>
          <th>Flight</th>
          <th>Origin</th>
          <th>Status</th>
          <th>Scheduled Time</th>
           
        </tr>
      </thead>
      <tbody>
        {arrivalData.map(flight => (
          <tr key={flight.flight.iataNumber}>
            <td>{flight.flight.iataNumber}</td>
            <td>{flight.departure.iataCode}</td>
            <td>{flight.status}</td>
            <td>{flight.departure.scheduledTime}</td>
           
          </tr>
        ))}
      </tbody>
    </table>
  );
  
  const renderDepartureTable = () => (
    <table>
      <thead>
        <tr>
          <th>Flight</th>
          <th>Destination</th>
          <th>Status</th>
          <th>Scheduled Time</th>
           
        </tr>
      </thead>
      <tbody>
        {departureData.map(flight => (
          <tr key={flight.flight.iataNumber}>
            <td>{flight.flight.iataNumber}</td>
            <td>{flight.arrival.iataCode}</td>
            <td>{flight.status}</td>
            <td>{flight.arrival.scheduledTime}</td>
          
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      <h1>Airport Information</h1>
      <select value={selectedIataCode} onChange={(e) => setSelectedIataCode(e.target.value)}>
      <option value="MHG">Mannheim Airport</option>
      <option value="FRA">Frankfurt International Airport</option>
      <option value="BER">Berlin Brandenburg Airport</option>
      <option value="CDG">Charles De Gaulle Airport</option>
      <option value="FKB">Karlsruhe/Baden-Baden</option>
      <option value="STR">Stuttgart Echterdingen</option>
      <option value="LUX">Findel Luxembourg</option>
      <option value="CGN">Cologne/bonn</option>
      <option value="NUE">Nürnberg</option>
      <option value="MUC">Franz Josef Strauss Munich</option>
      </select>
      <button className="submitButton" onClick={handleSubmit}>Submit</button>
      <div className="container">
        <div className="section">
          <h2>Arrivals</h2>
          {submitted && renderArrivalTable()}
        </div>
        <div className="section">
          <h2>Departures</h2>
          {submitted && renderDepartureTable()}
        </div>
      </div>
    </div>
  );
};

export default AirportInfo;