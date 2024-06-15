from flask import Flask, request, jsonify, render_template
import redis
import json
from pymongo import MongoClient
from pymongo.server_api import ServerApi


# Redis Connection
redis_host = 'redis-14691.c55.eu-central-1-1.ec2.redns.redis-cloud.com'
redis_port = 14691
redis_password = 'lXbrhTNm8D5p10mztjgZGOrRcPkVcTGh'  # Replace with your actual Redis password

redis_client = redis.StrictRedis(host=redis_host, port=redis_port, password=redis_password, decode_responses=True)

# MongoDB Atlas Connection
mongo_uri = "mongodb+srv://uhrenweltdeu:F3GZx2vA0ID7elWY@cluster0.lalzdak.mongodb.net/?appName=Cluster0"
mongo_client = MongoClient(mongo_uri, server_api=ServerApi('1'), tlsCAFile='/Users/vedantzalke/Desktop/Historicaldata/cacert.pem')
mongo_db = mongo_client['history']
collection_arrivals = mongo_db['arrinfo']
collection_departures = mongo_db['depinfo']

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


        filtered_obj = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [latitude, longitude]
            },
            "properties": {
                "Flight_name": flight_iata,
                "arrived_in": arrival_iata_upper,
                "date": estimated_time
            },
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
        data100 = {
            "type": "FeatureCollection",
            "features": process_flight_data(airports, flight_data)

        };
        print("I am the best!")
        print(json.dumps(data100))

        return json.dumps(data100), False
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

    # if cached:
    #     return jsonify(flights_data)

    return flights_data, 200

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

@app.route('/')
def index():
    return render_template('index.html')


dummydata2 = {
   "type":"FeatureCollection",
   "features":[
      {
         "type":"Feature",
         "geometry":{
            "type":"Point",
            "coordinates":[
               -87.9048,
               672
            ]
         },
         "properties":{
            "Flight_name":"aa7468",
            "arrived_in":"ORD",
            "date":"2024-06-13T14:42:53.000"
         }
      },
      {
         "type":"Feature",
         "geometry":{
            "type":"Point",
            "coordinates":[
               -80.29060363769531,
               8
            ]
         },
         "properties":{
            "Flight_name":"aa7624",
            "arrived_in":"MIA",
            "date":"2024-06-13T23:51:53.000"
         }
      },
      {
         "type":"Feature",
         "geometry":{
            "type":"Point",
            "coordinates":[
               -80.29060363769531,
               8
            ]
         },
         "properties":{
            "Flight_name":"aa7677",
            "arrived_in":"MIA",
            "date":"2024-06-13T21:19:53.000"
         }
      }
   ]
}

dummydata3 = {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [672, -87.9048]}, "properties": {"Flight_name": "aa7468", "arrived_in": "ORD", "date": "2024-06-13T14:42:53.000"}}]}
# Define the dummy GeoJSON data
dummy_geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [2.364436, 48.872834]  # Paris Charles de Gaulle Airport, France
            },
            "properties": {
                "name": "Paris Charles de Gaulle Airport",
                "country": "France",
                "code": "CDG"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-0.454296, 51.470022]  # London Heathrow Airport, United Kingdom
            },
            "properties": {
                "name": "London Heathrow Airport",
                "country": "United Kingdom",
                "code": "LHR"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [139.761296, 35.553256]  # Tokyo Haneda Airport, Japan
            },
            "properties": {
                "name": "Tokyo Haneda Airport",
                "country": "Japan",
                "code": "HND"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-73.778139, 40.641311]  # John F. Kennedy International Airport, USA
            },
            "properties": {
                "name": "John F. Kennedy International Airport",
                "country": "USA",
                "code": "JFK"
            }
        },
{
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [2.364436, 48.872834]  # Paris Charles de Gaulle Airport, France
            },
            "properties": {
                "name": "Paris Charles de Gaulle Airport",
                "country": "France",
                "code": "CDG"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-0.454296, 51.470022]  # London Heathrow Airport, United Kingdom
            },
            "properties": {
                "name": "London Heathrow Airport",
                "country": "United Kingdom",
                "code": "LHR"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [13.289444, 52.559722]  # Berlin Brandenburg Airport, Germany
            },
            "properties": {
                "name": "Berlin Brandenburg Airport",
                "country": "Germany",
                "code": "BER"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [4.763889, 52.308056]  # Amsterdam Airport Schiphol, Netherlands
            },
            "properties": {
                "name": "Amsterdam Airport Schiphol",
                "country": "Netherlands",
                "code": "AMS"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [11.799383, 45.627405]  # Verona Airport, Italy
            },
            "properties": {
                "name": "Verona Airport",
                "country": "Italy",
                "code": "VRN"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [12.351944, 45.438611]  # Venice Marco Polo Airport, Italy
            },
            "properties": {
                "name": "Venice Marco Polo Airport",
                "country": "Italy",
                "code": "VCE"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [2.075611, 41.297078]  # Barcelona–El Prat Airport, Spain
            },
            "properties": {
                "name": "Barcelona–El Prat Airport",
                "country": "Spain",
                "code": "BCN"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [2.743611, 39.551667]  # Malta International Airport, Malta
            },
            "properties": {
                "name": "Malta International Airport",
                "country": "Malta",
                "code": "MLA"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [23.9475, 35.339719]  # Heraklion International Airport, Greece
            },
            "properties": {
                "name": "Heraklion International Airport",
                "country": "Greece",
                "code": "HER"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [21.028611, 52.170834]  # Warsaw Chopin Airport, Poland
            },
            "properties": {
                "name": "Warsaw Chopin Airport",
                "country": "Poland",
                "code": "WAW"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [16.6925, 49.151389]  # Brno-Tuřany Airport, Czech Republic
            },
            "properties": {
                "name": "Brno-Tuřany Airport",
                "country": "Czech Republic",
                "code": "BRQ"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [17.214167, 48.170834]  # Vienna International Airport, Austria
            },
            "properties": {
                "name": "Vienna International Airport",
                "country": "Austria",
                "code": "VIE"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [21.335556, 42.572778]  # Skopje International Airport, North Macedonia
            },
            "properties": {
                "name": "Skopje International Airport",
                "country": "North Macedonia",
                "code": "SKP"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [19.793611, 45.434167]  # Podgorica Airport, Montenegro
            },
            "properties": {
                "name": "Podgorica Airport",
                "country": "Montenegro",
                "code": "TGD"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [16.256944, 46.224722]  # Ljubljana Jože Pučnik Airport, Slovenia
            },
            "properties": {
                "name": "Ljubljana Jože Pučnik Airport",
                "country": "Slovenia",
                "code": "LJU"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [19.256667, 47.436944]  # Debrecen International Airport, Hungary
            },
            "properties": {
                "name": "Debrecen International Airport",
                "country": "Hungary",
                "code": "DEB"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [25.685278, 40.970833]  # Iasi International Airport, Romania
            },
            "properties": {
                "name": "Iasi International Airport",
                "country": "Romania",
                "code": "IAS"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [25.832222, 62.894167]  # Rovaniemi Airport, Finland
            },
            "properties": {
                "name": "Rovaniemi Airport",
                "country": "Finland",
                "code": "RVN"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [22.015833, 65.546111]  # Luleå Airport, Sweden
            },
            "properties": {
                "name": "Luleå Airport",
                "country": "Sweden",
                "code": "LLA"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [6.110278, 46.238056]  # Geneva Airport, Switzerland
            },
            "properties": {
                "name": "Geneva Airport",
                "country": "Switzerland",
                "code": "GVA"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [14.190278, 40.884167]  # Naples International Airport, Italy
            },
            "properties": {
                "name": "Naples International Airport",
                "country": "Italy",
                "code": "NAP"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [14.508611, 35.849167]  # Malta International Airport, Malta
            },
            "properties": {
                "name": "Malta International Airport",
                "country": "Malta",
                "code": "MLA"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [13.767222, 51.278333]  # Dresden Airport, Germany
            },
            "properties": {
                "name": "Dresden Airport",
                "country": "Germany",
                "code": "DRS"
            }
        }
    ]
}

@app.route('/flights', methods=['GET'])
def get_flights_geojson():
    return jsonify(dummydata3)

if __name__ == '__main__':
    app.run(debug=True)