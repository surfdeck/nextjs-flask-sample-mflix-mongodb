from flask import Flask, jsonify, request
from pymongo import MongoClient
from bson import ObjectId
import os

app = Flask(__name__)

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client["sample_mflix"]
movies_collection = db["movies"]

app.config["MONGO_URI"] = "mongodb://localhost:27017/sample_mflix"

 
# Fetch movies based on search or category
@app.route('/api/movies', methods=['GET'])
def get_movies():
    category = request.args.get('category', '').lower()
    search = request.args.get('search', '')
    
    query = {}
    if search:
        query["$text"] = {"$search": search}
    
    if category == "trending":
        query["views"] = {"$gt": 1000}
    elif category == "top rated":
        query["rating"] = {"$gte": 8.0}
    elif category == "new releases":
        query["year"] = {"$gte": 2023}
    
    movies = list(movies_collection.find(query, {"_id": 0}).limit(20))
    return jsonify({"movies": movies}), 200
 
if __name__ == '__main__':
    app.run(debug=True)
