import json
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# MongoDB Atlas Connection
mongo_uri = "mongodb+srv://uhrenweltdeu:F3GZx2vA0ID7elWY@cluster0.lalzdak.mongodb.net/?appName=Cluster0"
mongo_client = MongoClient(mongo_uri, server_api=ServerApi('1'), tlsCAFile='/Users/vedantzalke/Desktop/Historicaldata/cacert.pem')

mongo_db = mongo_client['history']
collection_arrivals = mongo_db['arrival101']
collection_departures = mongo_db['departure101']

# Read JSON files
with open('arrival101.json', 'r') as f:
    arrival_data = json.load(f)

with open('departure101.json', 'r') as f:
    departure_data = json.load(f)

# Insert data into MongoDB collections
collection_arrivals.insert_many(arrival_data)
collection_departures.insert_many(departure_data)

print("Data successfully inserted into MongoDB.")

