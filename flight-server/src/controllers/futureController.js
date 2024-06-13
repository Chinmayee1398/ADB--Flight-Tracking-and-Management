const axios = require('axios');
const neo4j = require('neo4j-driver');

// Initialize Neo4j driver with environment variables
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// Verify Neo4j connectivity
driver.verifyConnectivity()
  .then(() => console.log('Successfully connected to Neo4j'))
  .catch(error => console.error('Failed to connect to Neo4j:', error));

// Function to fetch data with retry mechanism for handling rate limits
const fetchWithRetry = async (url, params, retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`Rate limited. Waiting for ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;  // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
};

exports.getFutureFlights = async (req, res) => {
  const session = driver.session();
  
  try {
    const { depIata, date } = req.query;

    if (!depIata) {
      console.error('Missing depIata');
      return res.status(400).send('Missing depIata');
    }

    const params = {
      key: process.env.AVIATION_EDGE_API_KEY,
      type: 'departure',
      iataCode: depIata,
      date,
    };

    const response = await fetchWithRetry('https://aviation-edge.com/v2/public/flightsFuture', params);
    console.log(`Fetched ${response.length} records from Aviation Edge API`);

    if (Array.isArray(response)) {
      let insertedCount = 0;

      for (const flight of response) {
        try {
          // Fetch departure and arrival airport data in parallel
          const [departureAirportResponse, arrivalAirportResponse] = await Promise.all([
            fetchWithRetry('https://aviation-edge.com/v2/public/airportDatabase', {
              key: process.env.AVIATION_EDGE_API_KEY,
              codeIataAirport: flight.departure.iataCode,
            }).catch(error => {
              console.error(`Failed to fetch data for airport ${flight.departure.iataCode}: ${error}`);
              return null;
            }),
            fetchWithRetry('https://aviation-edge.com/v2/public/airportDatabase', {
              key: process.env.AVIATION_EDGE_API_KEY,
              codeIataAirport: flight.arrival.iataCode,
            }).catch(error => {
              console.error(`Failed to fetch data for airport ${flight.arrival.iataCode}: ${error}`);
              return null;
            }),
          ]);

          if (!departureAirportResponse || !arrivalAirportResponse) {
            continue;
          }

          const departureAirportName = departureAirportResponse[0]?.nameAirport || 'Unknown';
          const arrivalAirportName = arrivalAirportResponse[0]?.nameAirport || 'Unknown';

          await session.run(
            `
            MERGE (d:Airport {iata: $departure})
            ON CREATE SET d.name = $departureName
            MERGE (a:Airport {iata: $arrival})
            ON CREATE SET a.name = $arrivalName
            MERGE (f:Flight {flightNumber: $flightNumber, airline: $airline, departure: $departure, arrival: $arrival})
            MERGE (f)-[:DEPARTS_FROM]->(d)
            MERGE (f)-[:ARRIVES_AT]->(a)
            `,
            {
              departure: flight.departure.iataCode,
              departureName: departureAirportName,
              arrival: flight.arrival.iataCode,
              arrivalName: arrivalAirportName,
              flightNumber: flight.flight.number,
              airline: flight.airline.iataCode,
            }
          );

          insertedCount++;
        } catch (error) {
          console.error(`Failed to insert flight: ${flight.flight.number}`, error);
        }
      }
      console.log(`Successfully processed ${response.length} flights.`);
      console.log(`Inserted ${insertedCount} flights into Neo4j.`);
    } else {
      console.error('Response is not an array:', response);
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching and saving data:', error);
    res.status(500).send('Server Error');
  } finally {
    try {
      await session.close();
      console.log('Neo4j session closed.');
    } catch (closeError) {
      console.error('Error closing Neo4j session:', closeError);
    }
  }
};
