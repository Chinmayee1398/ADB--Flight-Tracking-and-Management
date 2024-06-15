from flask import Flask, request, jsonify, render_template
import redis
import json
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# Redis Connection
redis_host = 'redis-14194.c250.eu-central-1-1.ec2.redns.redis-cloud.com'
redis_port = 14194
redis_password = 'ZQZouKcfHQhLHYa5QioOTNDeg0JZwjO5'  # Replace with your actual Redis password

redis_client = redis.StrictRedis(host=redis_host, port=redis_port, password=redis_password, decode_responses=True)

# MongoDB Atlas Connection
mongo_uri = "mongodb+srv://uhrenweltdeu:F3GZx2vA0ID7elWY@cluster0.lalzdak.mongodb.net/?appName=Cluster0"
mongo_client = MongoClient(mongo_uri, server_api=ServerApi('1'), tlsCAFile='/Users/vedantzalke/Desktop/Historicaldata/cacert.pem')
mongo_db = mongo_client['history']
collection_arrivals = mongo_db['historical_data']
collection_departures = mongo_db['historical_data2']


# Flask Application
app = Flask(__name__)

# Load airports data from airports.json
with open('airports.json', 'r') as f:
    airports_data = json.load(f)

# Function to retrieve longitude by iataCode
def get_longitude(airports, iata_code):
    for airport in airports:
        if airport['iataCode'] == iata_code:
            return airport['longitude']
    return None  # Return None if iata_code not found

# Function to retrieve latitude by iataCode
def get_latitude(airports, iata_code):
    for airport in airports:
        if airport['iataCode'] == iata_code:
            return airport['latitude']
    return None  # Return None if iata_code not found

# Function to process flight data and return filtered JSON
def process_flight_data(airports, flight_data):
    filtered_objects = []

    for flight in flight_data:
        arrival_iata = flight.get('arrival', {}).get('iataCode')
        flight_iata = flight.get('flight', {}).get('iataNumber')
        estimated_time = flight.get('departure', {}).get('estimatedTime')

        if not estimated_time:
            continue

        arrival_iata_upper = arrival_iata.upper() if arrival_iata else None

        longitude = get_longitude(airports, arrival_iata_upper)
        latitude = get_latitude(airports, arrival_iata_upper)

        filtered_obj1 = {
            "arrived_in": arrival_iata_upper,
            "Flight_name": flight_iata,
            "longitude": longitude,
            "latitude": latitude,
            "date": estimated_time
        }

        filtered_obj = {
             "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [longitude, latitude]
            },
            "properties": {
                "Flight_name": flight_iata,
                "arrived_in": arrival_iata_upper,
                "date": estimated_time
            }
        }


        filtered_objects.append(filtered_obj)

    return filtered_objects

# Function to fetch data from MongoDB or cache
def get_data_from_db_or_cache(collection, query, airports):
    cache_key = json.dumps(query, sort_keys=True)

    cached_data = redis_client.get(cache_key)
    if cached_data:
        try:
            flight_data = json.loads(cached_data)
            return process_flight_data(airports, flight_data), True
        except json.JSONDecodeError as e:
            print("Failed to decode JSON from cache:", e)
            return None, False

    cursor = collection.find(query)
    flight_data = list(cursor)

    if flight_data:
        redis_client.setex(cache_key, 3600, json.dumps(flight_data, default=str))
        return process_flight_data(airports, flight_data), False
    else:
        return None, False

@app.route('/arrival', methods=['GET'])
def get_arrivals():
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    if not (date_from and date_to):
        return jsonify({"error": "Missing required parameters"}), 400

    query = {
        "type": "arrival",
        "departure.scheduledTime": {"$gte": date_from, "$lte": date_to}
    }

    flights_data, cached = get_data_from_db_or_cache(collection_arrivals, query, airports_data)
    if not flights_data:
        return jsonify({"error": "Failed to fetch data from DB or cache"}), 500

    if cached:
        return jsonify(flights_data)

    return jsonify({"message": "Data fetched from DB", "data": flights_data}), 200

@app.route('/departure', methods=['GET'])
def get_departures():
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    if not (date_from and date_to):
        return jsonify({"error": "Missing required parameters"}), 400

    query = {
        "type": "departure",
        "departure.scheduledTime": {"$gte": date_from, "$lte": date_to}
    }

    flights_data, cached = get_data_from_db_or_cache(collection_departures, query, airports_data)
    if not flights_data:
        return jsonify({"error": "Failed to fetch data from DB or cache"}), 500

    if cached:
        return jsonify(flights_data)

    return jsonify({"message": "Data fetched from DB", "data": flights_data}), 200



@app.route('/test')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)