import React, { useState } from 'react';
import axios from 'axios';
import './FlightFinder.css';

const FlightFinder = () => {
    const [travelDate, setTravelDate] = useState('');
    const [departureCity, setDepartureCity] = useState('');
    const [arrivalCity, setArrivalCity] = useState('');
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
      setLoading(true);
      setError('');
      try {
          // Fetch and store flights
          await axios.get('http://localhost:5000/api/future-flights/fetch-flights', {
              params: {
                  departure: departureCity,
                  arrival: arrivalCity,
                  date: travelDate
              }
          });
  
          // Retrieve stored flights
          const response = await axios.get('http://localhost:5000/api/future-flights/stored-flights', {
              params: {
                  departure: departureCity,
                  arrival: arrivalCity,
                  date: travelDate
              }
          });
  
          // Replace airline and airport IATA codes with full names
          const updatedFlights = await Promise.all(response.data.map(async flightData => {
              const airlineCode = flightData.flight.airline;
              const departureCode = flightData.flight.departure;
              const arrivalCode = flightData.flight.arrival;
  
// Fetch airline name
const airlineResponse = await fetch(`https://aviation-edge.com/v2/public/airlineDatabase?key=4c3928-3500cc&codeIataAirline=${airlineCode}`);
if (!airlineResponse.ok) {
    console.error(`Error fetching airline data: ${airlineResponse.status}`);
} else {
    const airlineData = await airlineResponse.json();
    console.log(airlineData);  // Log the response data
    flightData.flight.airline = airlineData[0]?.nameAirline;
}

// Fetch departure airport name
const departureResponse = await fetch(`https://aviation-edge.com/v2/public/airportDatabase?key=4c3928-3500cc&codeIataAirport=${departureCode}`);
if (!departureResponse.ok) {
    console.error(`Error fetching departure airport data: ${departureResponse.status}`);
} else {
    const departureData = await departureResponse.json();
    console.log(departureData);  // Log the response data
    flightData.flight.departure = departureData[0]?.nameAirport;
}
// Fetch arrival airport name
const arrivalResponse = await fetch(`https://aviation-edge.com/v2/public/airportDatabase?key=4c3928-3500cc&codeIataAirport=${arrivalCode}`);
if (!arrivalResponse.ok) {
    console.error(`Error fetching arrival airport data: ${arrivalResponse.status}`);
} else {
    const arrivalData = await arrivalResponse.json();
    console.log(arrivalData);  // Log the response data
    flightData.flight.arrival = arrivalData[0]?.nameAirport;
}

return flightData;
          }));
  
          setFlights(updatedFlights);
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
                <label htmlFor="arrival-city">Arrival City:</label>
                <input
                    type="text"
                    id="arrival-city"
                    value={arrivalCity}
                    onChange={(e) => setArrivalCity(e.target.value)}
                />
            </div>
            <button className="searchbtn" onClick={handleSearch} disabled={loading}>
                {loading ? 'Searching...' : 'Search Flights'}
            </button>

            {error && <p className="error">{error}</p>}

            {flights.length > 0 && (
                <div className="flight-results">
                    <h2>Flight Results</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Flight Number</th>
                                <th>Airline</th>
                                <th>Departure</th>
                                <th>Arrival</th>
                                <th>Departure Time</th>
                            </tr>
                        </thead>
                        <tbody>
                        {flights.map((flightData, index) => (
    <tr key={index}>
        <td>{flightData.flight.flightNumber}</td>
        <td>{flightData.flight.airline}</td>
        <td>{flightData.flight.departure}</td>
        <td>{flightData.flight.arrival}</td>
        <td>{flightData.flight.time} CEST</td>
    </tr>
))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FlightFinder;
