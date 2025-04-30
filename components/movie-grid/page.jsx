"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import MovieCard from '@/components/movie-card/page'; 

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5328';

export default function MovieGrid({
    movies, 
    onDelete, 
    isSavedList, 
    user, 
    userSavedMovieIds, 
    onToggleSavedStatus, 
    isSavingUnsettingCardId 
}) {
  
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentError, setCommentError] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const fetchCommentsForMovie = useCallback(async (movieId) => {
       if (!movieId) return;

       setCommentError(null);
       try {
         const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/comments?movieId=${movieId}`);
         if (!res.ok) {
           const errorText = await res.text();
           throw new Error(`Failed to fetch comments: ${res.status} ${res.statusText} - ${errorText}`);
         }
         const data = await res.json();
         setComments(data.comments || []);
       } catch (err) {
         console.error("Fetching comments error:", err);
         setCommentError("Failed to load comments.");
       }
  }, [NEXT_PUBLIC_API_URL]);

  const openModal = useCallback((movie) => {
    if (!movie || !movie._id) {
      return;
    }

    setSelectedMovie(movie);
    setModalOpen(true);
    setNewCommentText("");

  }, []); 
  
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedMovie(null);
    setComments([]);
    setCommentError(null);
    setNewCommentText("");
    setIsSubmittingComment(false);
  }, []);

  useEffect(() => {
    if (selectedMovie) {
      fetchCommentsForMovie(selectedMovie._id);
    }
  }, [selectedMovie, fetchCommentsForMovie]);

  useEffect(() => {
      if (isModalOpen && selectedMovie && !movies?.find(m => m._id === selectedMovie._id)) {
           closeModal();
      } else if (!movies?.length && isModalOpen) {
           closeModal();
      }
  }, [movies, isModalOpen, selectedMovie, closeModal]);

  const handleAddComment = useCallback(async () => {
    if (!newCommentText.trim() || !selectedMovie?._id) {
      return;
    }
    if (!user) {
          
         return;
    }

    setIsSubmittingComment(true);
    try {
        const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movie_id: selectedMovie._id, text: newCommentText.trim() }),
          credentials: 'include', 
        });

        if (!response.ok) {
             const errorBody = await response.json().catch(() => ({}));
             return;
        }

        const data = await response.json();

        setNewCommentText("");
        fetchCommentsForMovie(selectedMovie._id); 

    } catch (error) {
    } finally {
        setIsSubmittingComment(false);
    }
  }, [newCommentText, selectedMovie, user, fetchCommentsForMovie, NEXT_PUBLIC_API_URL]);
 
const handleDeleteMovie = async (movieId) => {
  try {
    setLoadingMovieId(movieId); 
    const response = await fetch(`/api/movies/${movieId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      
      setSavedMovies((prev) => prev.filter((m) => m._id !== movieId));
    } else {
      console.error("Failed to delete movie:", await response.text());
    }
  } catch (error) {
    console.error("Error deleting movie:", error);
  } finally {
    setLoadingMovieId(null); 
  }
};

  const handleSelect = () => {
    console.log("Modal action button clicked for:", selectedMovie?.title);
    closeModal();
  };

  return (
    <div>
      {movies && movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <MovieCard
                  key={movie._id}
                  movie={movie}
                  onClick={openModal} 
                  onDelete={onDelete} 
                  isSavedList={isSavedList} 
                  user={user} 
                  userSavedMovieIds={userSavedMovieIds} 
                  onToggleSavedStatus={onToggleSavedStatus} 
                  isSavingUnsettingCardId={isSavingUnsettingCardId} 
              />
            ))}
          </div>
      ) : (
         <div className="text-white text-center text-lg">No movies available based on current filters.</div>
      )}
      <AnimatePresence>
        {isModalOpen && selectedMovie && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="relative bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-3xl w-full text-white overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              layoutId={selectedMovie._id}
            >

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-semibold shadow-md transition-colors"
                aria-label="Close modal"
              >
                ×
              </button>


              <div className="flex flex-col md:flex-row gap-6">
                {selectedMovie.poster ? (
                  <Image
                    src={selectedMovie.poster}
                    alt={selectedMovie.title}
                    width={300}
                    height={450}
                    className="rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-full md:w-64 h-64 md:h-auto bg-gray-700 flex items-center justify-center text-gray-400 rounded-lg flex-shrink-0">
                    No Poster Available
                  </div>
                )}

                <div className="flex-grow">
                  <h2 className="text-4xl font-bold mb-2 text-white">{selectedMovie.title}</h2>
                  <p className="text-gray-400 text-sm mb-4">
                    {selectedMovie.year} • {selectedMovie.runtime} min • {selectedMovie.genres?.join(", ")}
                  </p>

                  {selectedMovie.imdb?.rating && (
                    <div className="flex items-center mb-4">
                      <span className="text-yellow-500 font-bold text-lg mr-2">IMDb: {selectedMovie.imdb.rating}</span>
                      {selectedMovie.imdb?.votes && (
                        <span className="text-gray-400 text-sm">({selectedMovie.imdb.votes} votes)</span>
                      )}
                    </div>
                  )}

                  <p className="text-gray-300 mb-4">{selectedMovie.fullplot || selectedMovie.plot || "No plot available."}</p>

                  {selectedMovie.directors?.length > 0 && (
                    <p className="text-gray-400 text-sm mb-2">
                      <strong>Director{selectedMovie.directors.length > 1 ? 's' : ''}:</strong> {selectedMovie.directors.join(", ")}
                    </p>
                  )}
                  {selectedMovie.writers?.length > 0 && (
                    <p className="text-gray-400 text-sm mb-2">
                      <strong>Writer{selectedMovie.writers.length > 1 ? 's' : ''}:</strong> {selectedMovie.writers.join(", ")}
                    </p>
                  )}
                  {selectedMovie.cast?.length > 0 && (
                    <p className="text-gray-400 text-sm mb-2">
                      <strong>Cast:</strong> {selectedMovie.cast.join(", ")}
                    </p>
                  )}
                  {selectedMovie.awards?.text && (
                    <p className="text-green-400 text-sm mt-2"><strong>Awards:</strong> {selectedMovie.awards.text}</p>
                  )}
                  {selectedMovie.released && (
                    <p className="text-gray-500 text-sm mt-2">
                      <strong>Release Date:</strong> {new Date(selectedMovie.released).toLocaleDateString() || "N/A"}
                    </p>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h3 className="text-xl font-bold mb-4">Comments</h3>

                    {user ? (
                         <div className="mb-6">
                             <textarea
                                 className="w-full p-3 rounded-md border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                 rows="3"
                                 placeholder="Add a comment..."
                                 value={newCommentText}
                                 onChange={(e) => setNewCommentText(e.target.value)}
                                 disabled={isSubmittingComment}
                             ></textarea>
                             <button
                                 onClick={handleAddComment}
                                 className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                 disabled={!newCommentText.trim() || isSubmittingComment}
                             >
                                 {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                             </button>
                         </div>
                    ) : (
                         <p className="text-gray-400 text-sm mb-6">Login to add a comment.</p>
                    )}

                    {commentError ? (
                      <div className="text-red-500 text-sm">{commentError}</div>
                    ) : comments.length > 0 ? (
                      <ul>
                        {comments.map(comment => (
                          <li key={comment._id} className="mb-4 pb-4 border-b border-gray-800 last:border-b-0">
                            <p className="text-gray-300 italic">"{comment.text}"</p>
                            <p className="text-gray-500 text-sm mt-2">
                               - {comment.name}
                               {comment.date && ` on ${new Date(comment.date).toLocaleDateString()}`}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">No comments yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div> 
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}