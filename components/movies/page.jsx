"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";

const Movies = ({ category = "trending", title = "Movies Collection" }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  useEffect(() => {
    axios
      .get(`/api/movies/${category}`)
      .then((res) => {
        setMovies(res.data.movies || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching movie data. Please try again later.");
        setLoading(false);
      });
  }, [category]);

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {loading && !error && (
        <div className="flex justify-center items-center space-x-2">
          <span className="text-lg">Loading movies...</span>
          <div className="spinner-border animate-spin"></div>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <div key={movie._id} className="p-4 bg-white rounded-lg shadow hover:shadow-xl transition-shadow duration-300">
              <h4 className="text-lg font-semibold mb-2">{movie.title || "Untitled"}</h4>

              <div className="relative w-full h-72 mb-2">
                {movie.poster ? (
                  <Image
                  src={movie.poster || "/vercel.svg"} 
                  alt={movie.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                  />
                ) : (
                  <div className="flex justify-center items-center w-full h-full bg-gray-200 text-gray-500 rounded">
                    No Poster Available
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600">Release Date: {new Date(movie.released).toLocaleDateString() || "Unknown"}</p>
              <p className="text-sm text-gray-600">Genres: {movie.genres?.join(", ") || "Unknown"}</p>
              <p className="text-sm text-gray-600">Runtime: {movie.runtime ? `${movie.runtime} min` : "N/A"}</p>
              <p className="text-sm text-gray-600">Plot: {movie.plot || "No description available."}</p>

              {movie.imdb ? (
                <a
                  href={`https://www.imdb.com/title/${movie.imdb.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm mt-2 block"
                >
                  View Details on IMDb
                </a>
              ) : (
                <p className="text-sm text-gray-500 mt-2">Details coming soon.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        !loading && !error && <p>No movie data found.</p>
      )}
    </div>
  );
};

export default Movies;
