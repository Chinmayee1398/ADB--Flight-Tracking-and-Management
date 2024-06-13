import flask
import numpy as np
from flask import render_template, jsonify, send_from_directory, request
from pymongo import MongoClient
from haversine import haversine
import requests
import schedule
import time
import threading

# Initialize Flask app
app = flask.Flask(__name__)

# MongoDB connection
connection_string = 'mongodb+srv://sad2024group5:FxneTLnlLluHGICR@cluster0.vmmtjam.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
client = MongoClient(connection_string)
db = client.get_database('flights')

# Get a reference to the collection
flights_collection = db['flights']

# Example data to insert (assuming flights_data contains the list of flight information you provided)
flights_data = [
    {
        "aircraft": {
            "iataCode": "A320",
            "icao24": "3C66B1",
            "icaoCode": "A320",
            "regNumber": "D-AIUQ"
        },
        "airline": {
            "iataCode": "4Y",
            "icaoCode": "OCN"
        },
        "arrival": {
            "iataCode": "TFS",
            "icaoCode": "GCTS"
        },
        "departure": {
            "iataCode": "FRA",
            "icaoCode": "EDDF"
        },
        "flight": {
            "iataNumber": "4Y306",
            "icaoNumber": "OCN1MO",
            "number": "306"
        },
        "geography": {
            "altitude": 11277.6,
            "direction": 225,
            "latitude": 38.4642,
            "longitude": -8.4177
        },
        "speed": {
            "horizontal": 868.588,
            "isGround": 0,
            "vspeed": 0
        },
        "status": "en-route",
        "system": {
            "squawk": 0,
            "updated": 1718282837
        }
    },
    {
        "aircraft": {
            "iataCode": "A333",
            "icao24": "4BA9CB",
            "icaoCode": "A333",
            "regNumber": "TC-JNK"
        },
        "airline": {
            "iataCode": "TK",
            "icaoCode": "THY"
        },
        "arrival": {
            "iataCode": "IST",
            "icaoCode": "LTBA"
        },
        "departure": {
            "iataCode": "FRA",
            "icaoCode": "EDDF"
        },
        "flight": {
            "iataNumber": "TK1588",
            "icaoNumber": "THY60Q",
            "number": "1588"
        },
        "geography": {
            "altitude": 914.4,
            "direction": 214,
            "latitude": 41.2427,
            "longitude": 28.4337
        },
        "speed": {
            "horizontal": 425.96,
            "isGround": 0,
            "vspeed": 0
        },
        "status": "en-route",
        "system": {
            "squawk": 0,
            "updated": 1718282880
        }
    }
    # Add more flight documents as needed
]

# Insert multiple documents into the collection
flights_collection.insert_many(flights_data)

print("Flight data inserted successfully.")

# Define schedule for fetching flights data
def fetch_and_insert_flights():
    # Fetch from Aviation Edge API
    aviation_edge_api_key = '4c3928-3500cc'
    aviation_edge_url = f'https://aviation-edge.com/v2/public/flights?key={aviation_edge_api_key}&depIcao=EDDF'

    response = requests.get(aviation_edge_url)
    if response.status_code == 200:
        flights_data = response.json()
        if flights_data:
            db.flights.insert_many(flights_data)
            print(f"Inserted {len(flights_data)} flights into MongoDB from Aviation Edge at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            print("No new flight data from Aviation Edge to insert.")
    else:
        print(f"Failed to fetch data from Aviation Edge. Status code: {response.status_code}")

    # Fetch from local API
    local_api_url = 'http://localhost:5000/api/flights'  # Update with your Flask server's actual address
    response = requests.get(local_api_url)
    if response.status_code == 200:
        flights_data = response.json()
        if flights_data:
            db.flights.insert_many(flights_data)
            print(f"Inserted {len(flights_data)} flights into MongoDB from local API at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            print("No new flight data from local API to insert.")
    else:
        print(f"Failed to fetch data from local API. Status code: {response.status_code}")

# Schedule to fetch and insert flights data every 1 minute
schedule.every(1).minutes.do(fetch_and_insert_flights)

# Function to run scheduled tasks
def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

# Start scheduler in a separate thread
scheduler_thread = threading.Thread(target=run_scheduler)
scheduler_thread.start()

# Coordinates and radius for Frankfurt
frankfurt_lat = 50.110924
frankfurt_lon = 8.682127
safe_radius_km = 99.9
restricted_radius_km = 100

# Define restricted zones (area outside 100 km radius and above 8000 meters altitude)
restricted_zones = {
    'center': (frankfurt_lat, frankfurt_lon),
    'safe_radius_km': safe_radius_km,  # Radius of safe zone in kilometers
    'restricted_radius_km': restricted_radius_km,  # Radius of restricted zone in kilometers
    'min_altitude': 8000  # Minimum altitude for safe zone
}

# Routes
@app.route('/')
def index():
    # Pass restricted zone coordinates to the template
    return render_template('index.html', restricted_zone=restricted_zones)

@app.route('/api/flights')
def get_flights():
    flights_data = list(db.flights.find({}, {'_id': False}))
    return jsonify(flights_data)

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/safe')
def safe_zone():
    lat = float(request.args.get('lat', 50.110924))
    lon = float(request.args.get('lon', 8.682127))
    altitude = float(request.args.get('altitude', 0))  # Assuming altitude is passed in meters
    my_pos = (lat, lon)
    center = restricted_zones['center']
    safe_radius = restricted_zones['safe_radius_km']
    restricted_radius = restricted_zones['restricted_radius_km']
    min_altitude = restricted_zones['min_altitude']

    distance = haversine(my_pos, center)

    if altitude > min_altitude or (distance <= restricted_radius and altitude <= min_altitude):
        return jsonify({'restricted': False})
    else:
        return jsonify({'restricted': True})

@app.route('/airports')
def get_airports():
    airports_data = list(db.airports.find({'iso_country': 'DE'}, {'_id': False}))  # Adjust filter as per your data
    return jsonify(airports_data)

@app.route('/airportsin')
def get_airports_in_range():
    lat1 = float(request.args.get('lat1'))
    lon1 = float(request.args.get('lon1'))
    lat2 = float(request.args.get('lat2'))
    lon2 = float(request.args.get('lon2'))
    lat3 = float(request.args.get('lat3'))
    lon3 = float(request.args.get('lon3'))
    lat4 = float(request.args.get('lat4'))
    lon4 = float(request.args.get('lon4'))

    min_lat = min(lat1, lat2, lat3, lat4)
    max_lat = max(lat1, lat2, lat3, lat4)
    min_lon = min(lon1, lon2, lon3, lon4)
    max_lon = max(lon1, lon2, lon3, lon4)

    airports_in_range = list(db.airports.find({
        'lat': {'$gte': min_lat, '$lte': max_lat},
        'lon': {'$gte': min_lon, '$lte': max_lon}
    }, {'_id': False}))

    return jsonify(airportsin=airports_in_range)

# Main function to run the Flask app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
