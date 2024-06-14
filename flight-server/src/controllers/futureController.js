const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

driver.verifyConnectivity()
  .then(() => console.log('Successfully connected to Neo4j'))
  .catch(error => console.error('Failed to connect to Neo4j:', error));

const ensureIndexes = async () => {
    const session = driver.session();
    try {
        await session.run(`CREATE INDEX IF NOT EXISTS FOR (f:Flight) ON (f.flightNumber)`);
        await session.run(`CREATE INDEX IF NOT EXISTS FOR (f:Flight) ON (f.date)`);
        await session.run(`CREATE INDEX IF NOT EXISTS FOR (f:Flight) ON (f.time)`);
        await session.run(`CREATE INDEX IF NOT EXISTS FOR (a:Airport) ON (a.iataCode)`);
        await session.run(`CREATE INDEX IF NOT EXISTS FOR (al:Airline) ON (al.iataCode)`);
    } catch (error) {
        console.error('Error creating indexes:', error);
    } finally {
        await session.close();
    }
};

exports.fetchAndStoreFlights = async (req, res) => {
    const fetch = (await import('node-fetch')).default;
    const { departure, arrival, date } = req.query;
    const apiKey = process.env.AVIATION_EDGE_API_KEY;
    const url = `https://aviation-edge.com/v2/public/flightsFuture?key=${apiKey}&type=departure&iataCode=${departure}&date=${date}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('Unexpected response:', data);
            res.status(500).json({ error: 'Failed to fetch flight data' });
            return;
        }

        console.log(`Fetched ${data.length} records from the API.`);

        const session = driver.session();
        let insertedCount = 0;

        for (let flight of data) {
            if (!flight.flight || !flight.departure || !flight.arrival || !flight.aircraft || !flight.airline) {
                console.warn('Skipping flight due to missing data:', flight);
                continue;
            }
            if (typeof flight.departure.scheduledTime !== 'string') {
                console.warn('Skipping flight due to invalid scheduledTime:', flight.departure.scheduledTime);
                continue;
            }
        
            const flightData = {
                flightNumber: flight.flight.number,
                departure: flight.departure.iataCode,
                arrival: flight.arrival.iataCode,
                date: date, // use the date provided by the user
                time: flight.departure.scheduledTime, // directly assign scheduledTime to time
                airline: flight.airline.iataCode,
                status: 'Unknown',
                aircraft: flight.aircraft.modelCode,
                live: false
            };

            const query = `
            MERGE (f:Flight {flightNumber: $flightNumber})
            ON CREATE SET f.date = $date, f.time = $time, f.status = $status, f.aircraft = $aircraft, f.live = $live, f.departure = $departure, f.arrival = $arrival, f.airline = $airline
            ON MATCH SET f.date = $date, f.time = $time, f.status = $status, f.aircraft = $aircraft, f.live = $live, f.departure = $departure, f.arrival = $arrival, f.airline = $airline
            MERGE (dep:Airport {iataCode: $departure})
            MERGE (arr:Airport {iataCode: $arrival})     
            MERGE (al:Airline {iataCode: $airline})
            `;
            await session.run(query, flightData);
            insertedCount++;
        }
        session.close();
        console.log(`Inserted ${insertedCount} records into the database.`);
        res.json({ message: 'Flight data fetched and stored successfully' });
    } catch (error) {
        console.error('Error fetching and storing flight data:', error);
        res.status(500).json({ error: 'Failed to fetch and store flight data' });
    }
};

exports.getStoredFlights = async (req, res) => {
    const { departure, arrival, date } = req.query;

    try {
        const session = driver.session();
        const result = await session.run(
            `MATCH (f:Flight)
             WHERE f.date STARTS WITH $date AND f.departure = $departure AND f.arrival = $arrival
             RETURN f`,
            { departure, arrival, date }
        );

        const flights = result.records.map(record => ({
            flight: record.get('f').properties
        }));
        console.log(`Fetched ${flights.length} records from the database.`);
        session.close();
        res.json(flights);
    } catch (error) {
        console.error('Error retrieving stored flight data:', error);
        res.status(500).json({ error: 'Failed to retrieve stored flight data' });
    }
};

ensureIndexes();