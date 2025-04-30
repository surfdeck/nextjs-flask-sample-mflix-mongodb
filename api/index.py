
import os
from flask import Flask, jsonify, request, current_app, session 
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
from dotenv import load_dotenv 
import bcrypt 
from bson.objectid import ObjectId
from bson.errors import InvalidId
from math import ceil 
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user
)

from datetime import datetime 

load_dotenv()

app = Flask(__name__)

MOVIES_PER_PAGE_DEFAULT = 20 

app.config['SECRET_KEY'] = os.getenv("FLASK_SECRET_KEY")
if not app.config['SECRET_KEY']:
     
     app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

if not app.config['SECRET_KEY']:
    
    print("Error: Missing SECRET_KEY or FLASK_SECRET_KEY in .env file") 
    raise ValueError("Missing SECRET_KEY or FLASK_SECRET_KEY in .env file. Set this in your backend .env file.")



app.config['SESSION_COOKIE_SAMESITE'] = 'None' 
app.config['SESSION_COOKIE_SECURE'] = True     
app.config['SESSION_COOKIE_HTTPONLY'] = True   



MONGODB_URI = os.getenv("MONGODB_URI") 
if not MONGODB_URI:
    
    print("Error: Missing MongoDB URI in .env file")
    
    
    client = None
    sample_mflix_db = None 
    users_db = None
else:
    try:
        
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)   
        sample_mflix_db = client.get_database("sample_mflix")
        movies_collection = sample_mflix_db["movies"]     
        comments_collection = sample_mflix_db["comments"] 
   
        try:
             users_db = client.get_database("movies_db") 
             users_collection = users_db["users"]       
             
             if "users" not in users_db.list_collection_names():
                  print("Warning: 'users' collection not found in 'movies_db'. User authentication will not work until created.")
        except Exception as db_e:
             
             users_db = None
             users_collection = None



    except ConnectionFailure as e:
        
        client = None 
        sample_mflix_db = None 
        users_db = None
        
        movies_collection = None
        comments_collection = None
        users_collection = None
        theaters_collection = None
        sessions_collection = None
         
    except Exception as e:
        

        client = None 
        sample_mflix_db = None 
        users_db = None
         
        movies_collection = None
        comments_collection = None
        users_collection = None
        theaters_collection = None
        sessions_collection = None





if 'movies_collection' not in locals(): movies_collection = None
if 'comments_collection' not in locals(): comments_collection = None
if 'users_collection' not in locals(): users_collection = None
if 'theaters_collection' not in locals(): theaters_collection = None
if 'sessions_collection' not in locals(): sessions_collection = None





if app.config['SECRET_KEY'] and users_collection is not None:
    login_manager = LoginManager()
    login_manager.init_app(app)
    
    login_manager.unauthorized_handler(lambda: (jsonify({"error": "Login required"}), 401))
    
    login_manager.session_protection = "strong" 
else:
        
    def login_required(func):
        def wrapper(*args, **kwargs):
            return jsonify({"error": "Login system not initialized or database error"}), 500
        
        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper
    
    class AnonymousUser:
        is_authenticated = False
        is_active = False
        is_anonymous = True
        id = None
        name = "Guest"
        email = None
        def get_id(self): return None 

    current_user = AnonymousUser() 


class User(UserMixin):
    
    def __init__(self, user_data):
        
        self.id = str(user_data.get("_id")) if user_data and "_id" in user_data else None
        self.email = user_data.get("email", "")
        
        self.name = user_data.get("name", user_data.get("username", ""))

@login_manager.user_loader
def load_user(user_id):
    
    if users_collection is None:
        
        log_func = app.logger.error if app.has_request_context() else print
        log_func(f"User collection not available, cannot load user {user_id}")
        return None 

    try:
        
        if not ObjectId.is_valid(user_id):
             log_func = app.logger.error if app.has_request_context() else print
             log_func(f"Invalid user ID format in user_loader: {user_id}")
             return None 

        
        user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
        if user_doc:
            
            return User(user_doc)
    except Exception as e:
        
        log_func = app.logger.error if app.has_request_context() else print
        log_func(f"Error loading user {user_id}: {e}")
    return None 

def serialize_doc(doc):
    if isinstance(doc, dict):
        
        return {k: serialize_doc(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        
        return [serialize_doc(elem) for elem in doc]
    elif isinstance(doc, ObjectId):
        
        return str(doc)
    elif isinstance(doc, datetime):
        
        return doc.isoformat()
    else:
        
        return doc

@app.route('/api/register', methods=['POST'])
def register_user_route(): 
    
    if users_collection is None:
        return jsonify({"error": "Database connection failed or user collection not available for registration"}), 500

    logger = current_app.logger 
    data = request.get_json() 
    if not data:
        logger.warning("Registration attempt with empty payload.")
        return jsonify({"error": "Request body must be JSON"}), 400

    
    email = data.get('email', '').strip()
    password = data.get('password') 
    name = data.get('name', '').strip() 
    
    username = data.get('username', email).strip()


    
    if not email or not password:
        logger.warning(f"Registration missing email or password. Email provided: {'yes' if email else 'no'}")
        return jsonify({"error": "Email and password required"}), 400

    
    try:
        if users_collection.find_one({"email": email}):
            logger.warning(f"Registration attempt with existing email: {email}")
            return jsonify({"error": "User with this email already exists"}), 409 
    except OperationFailure as e:
        logger.error(f"MongoDB Operation Failed checking existing user during registration: {e}")
        return jsonify({"error": "Database error during registration check"}), 500
    except Exception as e:
        logger.error(f"An unexpected error occurred checking existing user during registration: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


    try:
        
        
        salt = bcrypt.gensalt() 
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8') 


        
        user_data = {
            "email": email,
            "password": hashed_password, 
            "name": name, 
            "username": username, 
            "created_at": datetime.utcnow(), 
            "saved_movie_ids": [] 
        }

        
        result = users_collection.insert_one(user_data)

        
        
        user_obj = User({**user_data, "_id": result.inserted_id})
        
        login_user(user_obj, remember=True) 

        
        logger.info(f"User registered and logged in successfully: {email}. User ID: {result.inserted_id}")
        return jsonify({
            "message": "User registered and logged in successfully!",
            "user": {
                 "id": str(result.inserted_id), 
                 "name": name,
                 "email": email,
                 "username": username 
                 
             }
         }), 201 

    except OperationFailure as e:
        logger.error(f"MongoDB Operation Failed during user registration insert: {e}")
        return jsonify({"error": "Database error during registration"}), 500
    except Exception as e:
        logger.error(f"An unexpected error occurred during user registration process: {e}", exc_info=True) 
        return jsonify({"error": "Internal server error during registration"}), 500



@app.route('/api/login', methods=['POST'])
def login_route(): 
    
    if users_collection is None:
        return jsonify({"error": "Database connection failed or user collection not available for login"}), 500

    logger = current_app.logger 
    data = request.get_json() 
    if not data:
        logger.warning("Login attempt with empty payload.")
        return jsonify({"error": "Request body must be JSON"}), 400

    
    email = data.get('email', '').strip()
    password = data.get('password') 

    
    if not email or not password:
        logger.warning(f"Login attempt missing email or password. Email provided: {'yes' if email else 'no'}")
        return jsonify({"error": "Email and password required"}), 400

    logger.info(f"Login attempt for email: {email}")

    try:
        
        user_doc = users_collection.find_one({"email": email})

        if not user_doc:
            
            logger.warning(f"Login failed: User not found for email: {email}")
            return jsonify({"error": "Invalid email or password"}), 401 

        
        retrieved_password_data = user_doc.get("password")
        if retrieved_password_data is None:
            
            logger.error(f"Password field missing for user {email} in database record.")
            return jsonify({"error": "Internal server error during login process"}), 500

        
        try:
             password_bytes = password.encode('utf-8') 
             
             if isinstance(retrieved_password_data, str):
                 hashed_password_bytes = retrieved_password_data.encode('utf-8')
             elif isinstance(retrieved_password_data, bytes):
                 
                 hashed_password_bytes = retrieved_password_data
             else:
                 
                 logger.error(f"CRITICAL: Unexpected password type in DB for user {email}: {type(retrieved_password_data)}")
                 return jsonify({"error": "Internal server error processing login (pwd type mismatch)"}), 500
        except Exception as encoding_e:
             
             logger.error(f"Unexpected encoding error during password check for user {email}: {encoding_e}", exc_info=True)
             return jsonify({"error": "Internal server error during login process"}), 500

        
        logger.debug(f"Comparing provided password with stored hash for {email}...")
        if not bcrypt.checkpw(password_bytes, hashed_password_bytes):
            
            logger.warning(f"Password mismatch for user {email}")
            return jsonify({"error": "Invalid email or password"}), 401 

        logger.debug("Password comparison successful. Logging user in.")

        user_obj = User(user_doc)
        login_user(user_obj, remember=True)

        
        logger.info(f"Login successful for {email}. Session established.")
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": str(user_doc["_id"]), 
                "name": user_doc.get("name", user_doc.get("username", "")), 
                "email": user_doc["email"]
                
            }
        }), 200 

    except OperationFailure as e:
        logger.error(f"MongoDB Operation Failed during login query for email {email}: {e}")
        return jsonify({"error": "Database error during login"}), 500
    except Exception as e:
        
        logger.error(f"An unexpected error occurred during login process for email {email}: {e}", exc_info=True)
        return jsonify({"error": "Internal server error during login process"}), 500


@app.route('/api/logout', methods=['POST'])
@login_required 
def logout_route(): 
    try:
        
        user_email = getattr(current_user, 'email', 'unknown') 
        logout_user()
        app.logger.info(f"User {user_email} logged out successfully.")
        return jsonify({"message": "Logout successful"}), 200
    except Exception as e:
        app.logger.error(f"An error occurred during logout: {e}", exc_info=True)
        return jsonify({"error": "Logout failed"}), 500



@app.route('/api/me', methods=['GET'])
@login_required 
def get_current_user_route(): 
    
    
    if current_user.is_authenticated:
        user_data = {
            "id": current_user.id, 
            "name": current_user.name,
            "email": current_user.email
            
            
        }
        app.logger.debug(f"/api/me returning user: {user_data.get('email')}")
        return jsonify({"user": user_data}), 200 
    else:
        app.logger.warning("/api/me reached without authentication despite @login_required")
        pass 





@app.route('/api/movies', methods=['GET'])
def get_movies_route(): 
    
    if movies_collection is None:
        print("Error: movies_collection is None in get_movies_route") 
        return jsonify({"error": "Database connection failed or movies collection not available"}), 500

    logger = current_app.logger
    try:
        
        search_term = request.args.get('search', '').strip()
        category = request.args.get('category', '').strip()
        page_str = request.args.get('page', '1') 
        limit_str = request.args.get('limit', str(MOVIES_PER_PAGE_DEFAULT)) 

        
        page = 1 
        limit = MOVIES_PER_PAGE_DEFAULT 
        try:
            page = int(page_str)
            if page <= 0: page = 1 
        except ValueError:
            logger.warning(f"Invalid page parameter received: '{page_str}'. Using default page {page}.")
            

        try:
            limit = int(limit_str)
            if limit <= 0: limit = MOVIES_PER_PAGE_DEFAULT 
            if limit > 100: limit = 100 
        except ValueError:
            logger.warning(f"Invalid limit parameter received: '{limit_str}'. Using default limit {limit}.")
            

        
        skip = (page - 1) * limit
        if skip < 0: skip = 0 


        query = {} 

        if search_term:

             query['title'] = {"$regex": search_term, "$options": "i"}

        if category:

            query['genres'] = category


        total_count = movies_collection.count_documents(query)

        movies_cursor = movies_collection.find(query).skip(skip).limit(limit)

        
        
        movies = [serialize_doc(movie) for movie in movies_cursor]

        
        logger.info(f"API /api/movies executed. Query: {query}, Page: {page}, Limit: {limit}, Skip: {skip}. Returned {len(movies)} movies (Total: {total_count} matching query).")

        
        return jsonify({
            "movies": movies,
            "total_count": total_count, 
            "page": page, 
            "limit": limit 
            }), 200 

    except OperationFailure as e:
        
        logger.error(f"MongoDB Operation Failed in get_movies_route: {e}")
        return jsonify({"error": "Database operation failed"}), 500 
    except Exception as e:
        
        logger.error(f"An unexpected error occurred in get_movies_route: {e}", exc_info=True) 
        return jsonify({"error": str(e)}), 500 



@app.route('/api/movies/<movie_id>', methods=['GET'])
def get_movie_by_id_route(movie_id): 
    if movies_collection is None or comments_collection is None:
        return jsonify({"error": "Database connection failed or collections not available"}), 500

    logger = current_app.logger
    try:
        
        movie_obj_id = ObjectId(movie_id)

        
        movie = movies_collection.find_one({"_id": movie_obj_id})

        if movie:
            
            movie = serialize_doc(movie)
            
            comments_cursor = comments_collection.find({"movie_id": movie_obj_id}).sort("date", -1)
            
            comments = [serialize_doc(comment) for comment in comments_cursor]

            
            logger.info(f"API /api/movies/{movie_id} executed. Found movie and {len(comments)} comments.")
            return jsonify({"movie": movie, "comments": comments}), 200 
        else:
            
            logger.warning(f"API /api/movies/{movie_id} executed. Movie not found.")
            return jsonify({"error": "Movie not found"}), 404 
    except InvalidId:
        
        logger.warning(f"Invalid movie ID format received: {movie_id}")
        return jsonify({"error": "Invalid movie ID format"}), 400 
    except OperationFailure as e:
        
        logger.error(f"MongoDB Operation Failed in get_movie_by_id_route for ID {movie_id}: {e}")
        return jsonify({"error": "Database operation failed"}), 500 
    except Exception as e:
        
        logger.error(f"An unexpected error occurred in get_movie_by_id_route for ID {movie_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500 


 

 
@app.route('/api/users/me/movies', methods=['GET'])
@login_required 
def get_saved_movies_route():
    
    if users_collection is None or movies_collection is None:
        return jsonify({"error": "Database connection failed or collections not available"}), 500

    logger = current_app.logger
    try:
        
        user_id_str = getattr(current_user, 'id', None)
        if not user_id_str:
             logger.error("Current user ID missing from Flask-Login user object in get_saved_movies_route.")
             return jsonify({"error": "User information unavailable"}), 500 

        
        try:
             user_obj_id = ObjectId(user_id_str)
        except InvalidId:
             logger.error(f"Invalid user ID format from current_user in get_saved_movies_route: {user_id_str}", exc_info=True)
             return jsonify({"error": "Internal server error processing user ID"}), 500


        
        user_doc = users_collection.find_one({"_id": user_obj_id}, {"saved_movie_ids": 1}) 

        if not user_doc:
             logger.error(f"User document not found for ID: {user_id_str} in get_saved_movies_route.")
             return jsonify({"error": "User data not found"}), 404 

        
        saved_movie_obj_ids = user_doc.get("saved_movie_ids", []) 

        
        valid_saved_movie_obj_ids = []
        for movie_id_item in saved_movie_obj_ids:
             
             if isinstance(movie_id_item, ObjectId):
                  valid_saved_movie_obj_ids.append(movie_id_item)
             elif isinstance(movie_id_item, str) and ObjectId.is_valid(movie_id_item):
                  try:
                       valid_saved_movie_obj_ids.append(ObjectId(movie_id_item))
                  except InvalidId:
                       logger.warning(f"Invalid ObjectId string found in user's saved_movie_ids list: {movie_id_item}. Skipping.")
                  except Exception as e:
                       logger.error(f"Unexpected error processing saved movie ID '{movie_id_item}' for user {user_id_str}: {e}", exc_info=True)
             else:
                  logger.warning(f"Unexpected type or format found in user's saved_movie_ids list: {movie_id_item} (type: {type(movie_id_item)}). Skipping.")


        
        saved_movies = []
        if valid_saved_movie_obj_ids:
            
            saved_movies_cursor = movies_collection.find({"_id": {"$in": valid_saved_movie_obj_ids}})
            
            
            saved_movies = [serialize_doc(movie) for movie in saved_movies_cursor]
            

        logger.info(f"API /api/users/me/movies executed for user {user_id_str}. Found {len(saved_movies)} saved movies.")
        return jsonify({"movies": saved_movies}), 200 

    except OperationFailure as e:
        logger.error(f"MongoDB Operation Failed in get_saved_movies_route for user {getattr(current_user, 'email', 'unknown')}: {e}")
        return jsonify({"error": "Database operation failed"}), 500
    except Exception as e:
        logger.error(f"An unexpected error occurred in get_saved_movies_route for user {getattr(current_user, 'email', 'unknown')}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500



@app.route('/api/users/me/movies', methods=['POST'])
@login_required 
def add_saved_movie_route():
    
    if users_collection is None or movies_collection is None:
        return jsonify({"error": "Database connection failed or collections not available"}), 500

    logger = current_app.logger
    try:
        
        user_id_str = getattr(current_user, 'id', None)
        if not user_id_str:
             logger.error("Current user ID missing from Flask-Login user object in add_saved_movie_route.")
             return jsonify({"error": "User information unavailable"}), 500 

        
        try:
             user_obj_id = ObjectId(user_id_str)
        except InvalidId:
             logger.error(f"Invalid user ID format from current_user in add_saved_movie_route: {user_id_str}", exc_info=True)
             return jsonify({"error": "Internal server error processing user ID"}), 500

        
        data = request.get_json()
        if not data or 'movie_id' not in data:
            logger.warning("Add saved movie attempt missing movie_id in payload.")
            return jsonify({"error": "Movie ID is required"}), 400

        movie_id_to_add_str = data.get('movie_id', '').strip()

        
        try:
            movie_obj_id_to_add = ObjectId(movie_id_to_add_str)
        except InvalidId:
            logger.warning(f"Invalid movie ID format received for adding: {movie_id_to_add_str} for user {user_id_str}")
            return jsonify({"error": "Invalid movie ID format"}), 400
 
        result = users_collection.update_one(
            {"_id": user_obj_id},
            {"$addToSet": {"saved_movie_ids": movie_obj_id_to_add}}
        )

        if result.modified_count > 0:
            
            logger.info(f"Movie {movie_id_to_add_str} added to saved list for user {user_id_str}.")
            return jsonify({"message": "Movie added successfully"}), 200 
        else:
            
            logger.warning(f"Attempted to add movie {movie_id_to_add_str} for user {user_id_str}, but it was already in the saved list.")
            return jsonify({"message": "Movie already in saved list"}), 200 

    except OperationFailure as e:
        logger.error(f"MongoDB Operation Failed in add_saved_movie_route for user {getattr(current_user, 'email', 'unknown')}: {e}")
        return jsonify({"error": "Database operation failed"}), 500
    except Exception as e:
        logger.error(f"An unexpected error occurred in add_saved_movie_route for user {getattr(current_user, 'email', 'unknown')}: {e}", exc_info=True)
        return jsonify({"error": "Internal server error during saving movie"}), 500

@app.route('/api/comments', methods=['GET'])
def get_comments_by_movie_id_route(): 
    
    if comments_collection is None:
        app.logger.error("comments_collection is None in get_comments_by_movie_id_route. Check MongoDB connection.")
        return jsonify({"error": "Database connection failed or comments collection not available"}), 500

    logger = current_app.logger
    try:
        
        movie_id = request.args.get('movieId', '').strip()

        if not movie_id:
            logger.warning("GET /api/comments missing movieId parameter.")
            return jsonify({"error": "Movie ID is required"}), 400 
 
        try:
            movie_obj_id = ObjectId(movie_id)
        except InvalidId:
            logger.warning(f"Invalid movie ID format received for comments: {movie_id}")
            return jsonify({"error": "Invalid movie ID format"}), 400 

        
        
        comments_cursor = comments_collection.find({"movie_id": movie_obj_id}).sort("date", -1)
        
        comments = [serialize_doc(comment) for comment in comments_cursor]

        logger.info(f"API /api/comments executed for movie {movie_id}. Found {len(comments)} comments.")
        return jsonify({"comments": comments}), 200 
    except OperationFailure as e:
        logger.error(f"MongoDB Operation Failed in get_comments_by_movie_id_route for movie ID {movie_id}: {e}")
        return jsonify({"error": "Database operation failed"}), 500 
    except Exception as e:
        logger.error(f"An unexpected error occurred in get_comments_by_movie_id_route for movie ID {movie_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500 


@app.route('/api/comments', methods=['POST'])
@login_required 
def add_comment_route(): 
    
    if comments_collection is None:
        app.logger.error("comments_collection is None in add_comment_route. Check MongoDB connection.")
        return jsonify({"error": "Database connection failed or comments collection not available"}), 500
    
    if users_collection is None:
         
         app.logger.error("users_collection is None in add_comment_route. Check MongoDB connection.")
         return jsonify({"error": "Database connection failed or user collection not available for commenting"}), 500


    logger = current_app.logger
    try:
        data = request.get_json()
        if not data:
             logger.warning("Add comment attempt with empty payload.")
             return jsonify({"error": "Request body must be JSON"}), 400

        
        
        user_id_str = getattr(current_user, 'id', None)
        name = getattr(current_user, 'name', 'Anonymous') 
        email = getattr(current_user, 'email', 'anonymous@example.com') 


        
        movie_id = data.get("movie_id", '').strip()
        text = data.get("text", '').strip()

        
        if not movie_id or not text:
            logger.warning(f"Add comment missing movie_id or text. User: {email}")
            return jsonify({"error": "Missing required comment data (movie_id, text)"}), 400

        
        try:
            movie_obj_id = ObjectId(movie_id)
        except InvalidId:
             logger.warning(f"Invalid movie ID format in add_comment for user {email}: {movie_id}")
             return jsonify({"error": "Invalid movie ID format"}), 400

        
        try:
             user_obj_id = ObjectId(user_id_str) if user_id_str and ObjectId.is_valid(user_id_str) else None
             if user_obj_id is None and user_id_str is not None: 
                   logger.error(f"CRITICAL: Invalid user ID format from current_user in add_comment: {user_id_str}")

        except Exception as user_id_e:
             
             logger.error(f"Unexpected error processing user ID from current_user in add_comment: {user_id_str}: {user_id_e}", exc_info=True)
             user_obj_id = None 
  
        comment = {
            "user_id": user_obj_id, 
            "name": name, 
            "email": email, 
            "movie_id": movie_obj_id, 
            "text": text, 
            "date": datetime.utcnow() 
        }

        
        inserted_comment = comments_collection.insert_one(comment)

        
        logger.info(f"Comment added by user {email} for movie {movie_id}. Comment ID: {inserted_comment.inserted_id}")
        return jsonify({"message": "Comment added successfully!", "comment_id": str(inserted_comment.inserted_id)}), 201 

    except OperationFailure as e:
        
        logger.error(f"MongoDB Operation Failed in add_comment_route for user {getattr(current_user, 'email', 'unknown')}: {e}")
        return jsonify({"error": "Database operation failed"}), 500 
    except Exception as e:
        
        logger.error(f"An unexpected error occurred in add_comment_route for user {getattr(current_user, 'email', 'unknown')}: {e}", exc_info=True) 
        return jsonify({"error": "Internal server error during commenting"}), 500 


@app.route('/api/users/me/movies/<movie_id>', methods=['DELETE'])
@login_required 
def remove_saved_movie_route(movie_id):
    
    if users_collection is None:
        current_app.logger.error("movies_collection is None in remove_saved_movie_route. Check MongoDB connection.")
        return jsonify({"error": "Database connection failed or user collection not available"}), 500

    logger = current_app.logger
    logger.info(f"Attempting to remove movie with ID: {movie_id} for user {getattr(current_user, 'email', 'unknown')}") 

    try:
        
        user_id_str = getattr(current_user, 'id', None)
        if not user_id_str:
             logger.error("Current user ID missing from Flask-Login user object in remove_saved_movie_route.")
             return jsonify({"error": "User information unavailable"}), 500 

        
        try:
            movie_obj_id_to_remove = ObjectId(movie_id)
            logger.info(f"Converted movie_id '{movie_id}' to ObjectId: {movie_obj_id_to_remove}") 
        except InvalidId:
            logger.warning(f"Invalid movie ID format received for removal: {movie_id} for user {user_id_str}")
            return jsonify({"error": "Invalid movie ID format"}), 400 

        
        try:
             user_obj_id = ObjectId(user_id_str)
             logger.info(f"Converted user_id '{user_id_str}' to ObjectId: {user_obj_id}") 
        except InvalidId:
             logger.error(f"Invalid user ID format from current_user in remove_saved_movie_route: {user_id_str}", exc_info=True)
             return jsonify({"error": "Internal server error processing user ID"}), 500
 
        logger.info(f"Executing MongoDB $pull operation for user {user_id_str}, removing movie_id {movie_obj_id_to_remove}") 
        result = users_collection.update_one(
            {"_id": user_obj_id},
            {"$pull": {"saved_movie_ids": movie_obj_id_to_remove}}
        )
        logger.info(f"MongoDB update_one result: Matched Count = {result.matched_count}, Modified Count = {result.modified_count}") 


        if result.modified_count > 0: 
            
            logger.info(f"Movie {movie_id} removed from saved list for user {user_id_str}. Modified count: {result.modified_count}")
            return jsonify({"message": "Movie removed successfully"}), 200 
        else:
            
            
            logger.warning(f"Attempted to remove movie {movie_id} from saved list for user {user_id_str}, but it was not found in the list. Modified count: {result.modified_count}")
            
            if result.matched_count == 0:
                 logger.warning(f"User document not matched for ID {user_id_str} during remove operation.")
                 
            return jsonify({"error": "Movie not found in saved list"}), 404 

    except OperationFailure as e: 
        logger.error(f"MongoDB Operation Failed in remove_saved_movie_route for user {getattr(current_user, 'email', 'unknown')}: {e}", exc_info=True) 
        return jsonify({"error": "Database operation failed"}), 500 
    except Exception as e: 
        logger.error(f"An unexpected error occurred in remove_saved_movie_route for user {getattr(current_user, 'email', 'unknown')}: {e}", exc_info=True) 
        return jsonify({"error": "Internal server error during removing movie"}), 500 




 