
"use client";
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/nav/page';
import Hero from '@/components/hero/page'; 
import MovieGrid from '@/components/movie-grid/page'; 
import Footer from '@/components/footer/page';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5328';



const MOVIES_PER_PAGE = 20; 

export default function HomePage() { 
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userAuthError, setUserAuthError] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [moviesError, setMoviesError] = useState(null);
  const [totalMovies, setTotalMovies] = useState(0); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userSavedMovieIds, setUserSavedMovieIds] = useState([]); 
  const [loadingUserSavedMovies, setLoadingUserSavedMovies] = useState(false); 

  const [isSavingUnsettingCardId, setIsSavingUnsettingCardId] = useState(null);


  useEffect(() => {
    const checkLogin = async () => {
      setLoadingUser(true);
      setUserAuthError(null);
    
      try {
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();

          setUser(data.user);
        } else if (res.status === 401) {

          setUser(null);
        } else {
          const errorBody = await res.json().catch(() => ({}));
          setUserAuthError("Unable to verify login status.");
          setUser(null);
        }
      } catch (err) {

        setUserAuthError("Network error during login check.");
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    

    checkLogin(); 

  }, [NEXT_PUBLIC_API_URL]); 

  useEffect(() => {
      const fetchUserSavedMovies = async () => {
          
          if (!user) {
              setUserSavedMovieIds([]); 

              return;
          }

          setLoadingUserSavedMovies(true); 
          try {
              const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/users/me/movies`, {
                  credentials: 'include', 
              });
              if (res.ok) {
                  const data = await res.json();
                   
                   
                  if (data && Array.isArray(data.movies)) {
                      const savedIds = data.movies.map(movie => movie._id);

                      setUserSavedMovieIds(savedIds);
                  } else {

                      setUserSavedMovieIds([]); 
                  }
              } else if (res.status === 401) {
                   

                   setUser(null);
                   setUserSavedMovieIds([]);
              }
              else {

                  setUserSavedMovieIds([]); 
              }
          } catch (err) {

              setUserSavedMovieIds([]); 
          } finally {
              setLoadingUserSavedMovies(false); 

          }
      };

      fetchUserSavedMovies(); 

  }, [user, NEXT_PUBLIC_API_URL]); 


  useEffect(() => {
    const fetchMovies = async () => {
      setLoadingMovies(true);
      setMoviesError(null);
      setMovies([]); 

      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('page', currentPage.toString());
      params.append('limit', MOVIES_PER_PAGE.toString());

      try {
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/movies?${params.toString()}`);

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(`Failed to fetch movies: ${res.status} ${res.statusText} - ${errorBody.error || 'Unknown error'}`);
        }

        const data = await res.json();
        if (data && Array.isArray(data.movies)) {
            setMovies(data.movies);
            setTotalMovies(data.total_count);
            setTotalPages(Math.ceil(data.total_count / MOVIES_PER_PAGE));
        } else {

             setMovies([]); 
             setTotalMovies(0);
             setTotalPages(1);
             setMoviesError("Received unexpected data format for movies.");
        }


      } catch (err) {

        setMoviesError("Failed to load movies. Please try again later.");
        setMovies([]); 
        setTotalMovies(0);
        setTotalPages(1);
      } finally {
        setLoadingMovies(false);
      }
    };

    fetchMovies();

    
  }, [searchTerm, selectedCategory, currentPage, NEXT_PUBLIC_API_URL]);


  
  const handlePageChange = useCallback((page) => {

    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
       
       
    } else {

    }
  }, [totalPages]);

  
  const handleSearch = useCallback((term) => {

      setSearchTerm(term);
      setCurrentPage(1); 
  }, []);


  
  const handleLogout = async () => {

    try {
      const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        setUser(null); 
        setUserSavedMovieIds([]);
      } else {
        const data = await res.json().catch(() => ({}));
      }
    } catch (err) {
    }
  };


  const handleLoginSuccess = useCallback((loggedInUser) => {

    setUser(loggedInUser); 
  }, []);


  
  const handleToggleSavedStatus = useCallback(async (movieId) => {
    if (!user || !movieId) {
        console.warn("Toggle saved status failed: No user or invalid movieId."); 
        return;
    }

    
    setIsSavingUnsettingCardId(movieId);

    const isCurrentlySaved = userSavedMovieIds.includes(movieId); 
    const method = isCurrentlySaved ? 'DELETE' : 'POST'; 
    const url = `${NEXT_PUBLIC_API_URL}/api/users/me/movies${isCurrentlySaved ? `/${movieId}` : ''}`; 

    console.log(`API call to ${method} ${url}`); 

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            
            body: method === 'POST' ? JSON.stringify({ movie_id: movieId }) : null,
            credentials: 'include', 
        });

        console.log("Toggle saved status API Response:", response); 

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
             
        } else {
            
            if (isCurrentlySaved) {
                
                setUserSavedMovieIds(prevIds => prevIds.filter(id => id !== movieId));
            } else {
                
                setUserSavedMovieIds(prevIds => [...prevIds, movieId]);
            }
          }

    } catch (error) {
    } finally {

        setIsSavingUnsettingCardId(null);
    }
  }, [user, userSavedMovieIds, NEXT_PUBLIC_API_URL]); 

  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    setCurrentPage(1); 
  }, []);

 
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-200 bg-gray-300">
        Loading user data…
      </div>
    );
  }
 
  return (
    <div className="min-h-screen flex flex-col bg-indigo-500/25 text-white">

      <Navbar user={user} loadingUser={loadingUser}   onLogout={handleLogout} onLoginSuccess={handleLoginSuccess} />

      <Hero 
        onSearch={handleSearch} 
        onCategorySelect={handleCategorySelect} 
        selectedCategory={selectedCategory}
      />
      <div className="flex-grow container mx-auto px-4 text-center sm:px-6 py-8">
      <h1  className='m-10 lg:text-3xl md:text-3xl font-bold '>Next Js with Flask and MongoDB</h1>
      <p className='m-5 lg:text-2xl md:text-xl text-yellow-500 '>Find comment and save your favorite movies!</p>
      </div>

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-center">
          
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)} 
            className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow" 
          />

           <select
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value)} 
              className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
           >
              <option value="">All Categories</option>
              <option value="Action">Action</option>
              <option value="Comedy">Comedy</option>
              <option value="Drama">Drama</option>
              <option value="Thriller">Thriller</option>

           </select>
        </div>

        {userAuthError && ( 
             <div className="text-center text-red-400 bg-red-900/30 border border-red-700 rounded-md py-4 px-4 mb-6">
                 {userAuthError}
             </div>
        )}
        <h1 className="text-2xl sm:text-3xl text-white font-bold mb-8 tracking-tight">All Movies</h1>

        {loadingMovies ? (
          <div className="text-center text-gray-500 py-10">Loading movies...</div>
        ) : moviesError ? (
          <div className="text-center text-red-400 bg-red-900/30 border border-red-700 rounded-md py-6 px-4 mb-6">
            {moviesError}
          </div>
        ) : movies.length > 0 ? (

          <MovieGrid
            movies={movies} 
            user={user} 
            userSavedMovieIds={userSavedMovieIds} 
            onToggleSavedStatus={handleToggleSavedStatus} 
            isSavingUnsettingCardId={isSavingUnsettingCardId} 
            
             isSavedList={false} 
          />
        ) : (
          
          <div className="text-white text-center text-lg">No movies found based on your search and filters.</div>
        )}

        {totalMovies > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

      </main>

      <Footer />

    </div>
  );
}