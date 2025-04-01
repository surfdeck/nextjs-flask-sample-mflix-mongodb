"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Image from "next/image"; // Import the Image component

export default function MovieGrid({ movies }) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [comments, setComments] = useState([]); // State to hold comments

  // Extract unique genres from movies
  const genres = ["All", ...new Set(movies.flatMap(movie => movie.genres || []))];

  // Filter movies by selected genre
  const filteredMovies = movies.filter(movie => 
    selectedGenre === "All" || movie.genres?.includes(selectedGenre)
  );

  // Function to open the movie modal and fetch comments
  const openModal = async (movie) => {
    setSelectedMovie(movie);
    setModalOpen(true);
    
    // Check if movie._id exists
    console.log('Selected movie _id:', movie._id);  // Log the _id to ensure it's correct
  
    // Fetch the comments associated with the selected movie
    try {
      const response = await fetch(`/api/comments?movieId=${movie._id}`);
      const data = await response.json();
      setComments(data.comments || []); // Set the comments to the state
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };


  const closeModal = () => {
    setModalOpen(false);
    setComments([]); // Reset comments when closing modal
  };

  return (
    <div className="p-6">
      {/* Genre Filter Dropdown */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Filter by Genre:</label>
        <select
          className="p-2 border rounded-lg"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      {/* Movie Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMovies.map((movie, index) => (
          <motion.div
            key={movie._id || index}  // Use index if _id is missing
            className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-105 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => openModal(movie)}
          >
            <Image
              src={movie.poster || "/vercel.svg"} // Use Next.js Image component
              alt={movie.title}
              width={300} // Set the width
              height={200} // Set the height
              className="w-full h-48 object-cover rounded-lg"
            />
            <h3 className="text-lg font-bold mt-2">{movie.title}</h3>
            <p className="text-gray-500">{movie.year} • {movie.runtime} min</p>
            <p className="text-indigo-600">{movie.genres?.join(", ")}</p>
            <p className="text-gray-600">Cast: {movie.cast?.slice(0, 3).join(", ") || "N/A"}</p>
          </motion.div>
        ))}
      </div>

      {/* Movie Modal */}
      {isModalOpen && selectedMovie && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div
            className="bg-white rounded-lg p-6 max-w-full sm:max-w-lg w-full shadow-lg relative"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} className="absolute top-4 right-4 text-xl -my-2 -mx-2 text-gray-500 hover:text-red-900">
              &times;
            </button>
            <Image
              src={selectedMovie.poster || "/vercel.png"} // Use Next.js Image component
              alt={selectedMovie.title}
              width={500} // Set the width
              height={300} // Set the height
              className="w-full h-60 object-cover rounded-lg"
            />
            <h2 className="text-2xl font-bold mt-4">{selectedMovie.title}</h2>
            <p className="text-gray-600">{selectedMovie.year} • {selectedMovie.runtime} min</p>
            <p className="text-gray-600">{selectedMovie.genres?.join(", ")}</p>
            <p className="mt-2">{selectedMovie.fullplot || "No detailed plot available."}</p>

            {selectedMovie.directors && (
              <p className="text-gray-700 mt-2">
                <strong>Director(s):</strong> {selectedMovie.directors.join(", ")}
              </p>
            )}

            {selectedMovie.writers && (
              <p className="text-gray-700 mt-2">
                <strong>Writer(s):</strong> {selectedMovie.writers.join(", ")}
              </p>
            )}

            {selectedMovie.awards && selectedMovie.awards.text && (
              <p className="text-green-700 mt-2"><strong>Awards:</strong> {selectedMovie.awards.text}</p>
            )}

            {selectedMovie.imdb && (
              <p className="text-yellow-600 mt-2">
                <strong>IMDb Rating:</strong> {selectedMovie.imdb.rating || "N/A"} ({selectedMovie.imdb.votes || 0} votes)
              </p>
            )}

            <p className="text-gray-500 mt-2">
              <strong>Release Date:</strong> {new Date(selectedMovie.released).toLocaleDateString() || "N/A"}
            </p>

          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
