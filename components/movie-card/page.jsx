"use client";

import Image from "next/image";
import { motion } from "framer-motion";

function MovieCard({
  movie,
  onClick,
  onDelete,
  isSavedList,
  user,
  userSavedMovieIds,
  onToggleSavedStatus,
  isSavingUnsettingCardId,
}) {
 
  const isMovieSaved = user && userSavedMovieIds?.includes(movie._id);
  const isThisCardSavingUnsetting = isSavingUnsettingCardId === movie._id;

  return (
    <motion.div
      className="relative bg-black/90 unded-xl shadow-lg overflow-hidden cursor-pointer group transform transition-transform duration-300 hover:scale-105 flex flex-col"
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      onClick={() => {
        console.log("--- Movie Card main click handler fired for:", movie.title);
        onClick(movie);
      }}
      layoutId={movie._id}
    >
      
      {movie.poster ? (
        <Image
          src={movie.poster}
          alt={movie.title}
          width={500}
          height={750}
          className="w-full h-auto object-cover group-hover:opacity-80 transition-opacity duration-300"
          priority={false}
        />
      ) : (
        <div className="w-full h-64 bg-gray-700 flex items-center justify-center text-gray-400">
          No Poster Available
        </div>
      )}

      
      <div className="p-3 flex-grow">
        <h3 className="text-base font-bold text-white mb-1 truncate">{movie.title}</h3>
        <p className="text-xs text-gray-400 mt-1">{movie.year} • {movie.runtime} min</p>
        {movie.imdb?.rating && (
          <p className="text-xs text-yellow-500 mt-1">IMDb: {movie.imdb.rating}</p>
        )}
      </div>

      
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

      
      {user && !isSavedList && onToggleSavedStatus && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("--- Save/Unsave button clicked for:", movie.title);
              onToggleSavedStatus(movie._id);  
            }}
            className={`p-2 rounded-full shadow-md transition-colors
              ${isThisCardSavingUnsetting
                ? 'bg-gray-500 text-gray-300'
                : isMovieSaved
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            disabled={isThisCardSavingUnsetting}
            aria-label={isMovieSaved ? 'Remove from saved list' : 'Add to saved list'}
          >
            {isThisCardSavingUnsetting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isMovieSaved ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        </div>
      )}

       
      {isSavedList && onDelete && (
        <div className="p-3 pt-0 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("--- Remove button clicked for:", movie.title);
              onDelete(movie._id);
            }}
            className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSavingUnsettingCardId === movie._id}
          >
            {isSavingUnsettingCardId === movie._id ? 'Removing...' : 'Remove'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default MovieCard;
