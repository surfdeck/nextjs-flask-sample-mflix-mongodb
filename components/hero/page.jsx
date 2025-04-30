"use client";
import Image from 'next/image'; 
import { useState, useEffect, useCallback } from 'react'; 
import { motion, AnimatePresence } from "motion/react"; 
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5328';
const SLIDE_INTERVAL = 7000; 

const Hero = () => {
  
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchFeaturedMovies = async () => {
      setLoading(true); 
      setError(null); 
      try {
        
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/movies/featured`); 

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(`Failed to fetch featured movies: ${res.status} ${res.statusText} - ${errorBody.error || 'Unknown error'}`);
        }

        const data = await res.json();
        
        if (data && Array.isArray(data.movies) && data.movies.length > 0) { 
          
          const moviesWithPosters = data.movies.filter(movie => movie.poster);
          if (moviesWithPosters.length > 0) {
             setFeaturedMovies(moviesWithPosters); 
             console.log("Fetched and filtered featured movies (with posters):", moviesWithPosters); 
          } else {
             console.warn("Fetched featured movies, but none have posters. Hero will show placeholder.");
             setFeaturedMovies([]); 
             setError("No featured movies with posters available."); 
          }
        } else {
            console.warn("API response for featured movies is empty or malformed:", data);
            setFeaturedMovies([]); 
            setError("No featured movies available."); 
        }

      } catch (err) {
        console.error("Fetching featured movies error:", err);
        setError("Failed to load featured movies. Please try again later."); 
        setFeaturedMovies([]); 
      } finally {
        setLoading(false); 
      }
    };

    fetchFeaturedMovies(); 

  }, [NEXT_PUBLIC_API_URL]); 

  useEffect(() => {
    
    if (featuredMovies.length > 1) {
      const interval = setInterval(() => {
        setCurrentMovieIndex(prevIndex => (prevIndex + 1) % featuredMovies.length);
      }, SLIDE_INTERVAL); 
      return () => clearInterval(interval);
    }
    
    if (featuredMovies.length <= 1) {
        setCurrentMovieIndex(0); 
    }
    
  }, [featuredMovies]);
  const goToSlide = useCallback((index) => {
    setCurrentMovieIndex(index);
    
  }, []);
  
  if (loading && featuredMovies.length === 0) {
    return (
      <section className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] bg-gray-800 flex items-center justify-center text-gray-400">
        Loading featured films... 
      </section>
    );
  }

  if (error && featuredMovies.length === 0) {
     return (
       <section className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] bg-red-900/30 text-red-400 flex items-center justify-center text-center p-4">
         Error loading featured films: {error} 
       </section>
     );
   }
  
  const currentMovie = featuredMovies[currentMovieIndex];
  
  if (!currentMovie) {
       return (
            <section className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] bg-gray-800 flex items-center justify-center text-gray-400 text-center p-4">
              No featured movies available at this time.
            </section>
       );
  }

  return (
    
    <section className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
      
      
      <AnimatePresence initial={false} mode='wait'>
        
        
          <motion.div
            key={currentMovie._id || 'placeholder'} 
            className="absolute inset-0" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.8, ease: "easeInOut" }} 
          >
            
            {currentMovie.poster ? ( 
              <Image
                src={currentMovie.poster} 
                alt={`Background for ${currentMovie.title}`} 
                layout="fill" 
                objectFit="cover" 
                quality={90} 
                priority={currentMovieIndex === 0} 
                className="z-0" 
              />
            ) : (
              
              <div className="absolute inset-0 bg-gray-700 z-0 flex items-center justify-center text-gray-400">
                 No Poster Available
              </div>
            )}
            <div className="absolute inset-0 bg-black opacity-70 z-10"></div> 
            <div className="relative z-20 flex items-center h-full text-white px-6 md:px-12 lg:px-24"> 
              
              <div className="max-w-xl text-left"> 
                
                <motion.h1
                  className="text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg" 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {currentMovie.title} 
                </motion.h1>

                
                
                <motion.p
                  className="text-sm md:text-base text-gray-300 mb-3 drop-shadow-lg" 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {currentMovie.year && `${currentMovie.year} • `} 
                    {currentMovie.runtime && `${currentMovie.runtime} min • `} 
                    {currentMovie.genres?.join(", ")} 
                </motion.p>

                
                <motion.p
                  className="text-sm md:text-base text-gray-300 mb-6 drop-shadow-lg line-clamp-3"  
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {currentMovie.fullplot || currentMovie.plot || "Discover your next favorite movie."}  
                </motion.p>

                 {currentMovie.directors?.length > 0 && (
                     <motion.p
                         className="text-xs md:text-sm text-gray-400 mb-2 drop-shadow-lg"
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.5, delay: 0.3 }}
                     >
                         <strong>Director{currentMovie.directors.length > 1 ? 's' : ''}:</strong> {currentMovie.directors.join(", ")}
                     </motion.p>
                 )}
                  
              </div> 
            </div> 
          </motion.div>

      </AnimatePresence>  

      {featuredMovies.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex space-x-3">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)} 
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentMovieIndex ? 'bg-white' : 'bg-gray-500 hover:bg-gray-300' 
              }`}
              aria-label={`Go to featured movie ${index + 1}`} 
            ></button>
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;