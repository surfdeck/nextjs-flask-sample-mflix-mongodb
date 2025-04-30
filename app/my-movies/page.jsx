"use client";

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/nav/page'; 
import MovieGrid from '@/components/movie-grid/page'; 
import { useRouter } from 'next/navigation';
import Footer from '@/components/footer/page'; 
import Link from 'next/link'; 

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5328';


export default function MyMoviesPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userAuthError, setUserAuthError] = useState(null);
  const [savedMovies, setSavedMovies] = useState([]);
  const [loadingSavedMovies, setLoadingSavedMovies] = useState(true);
  const [savedMoviesError, setSavedMoviesError] = useState(null);
  const [userSavedMovieIds, setUserSavedMovieIds] = useState([]);

  const [isSavingUnsettingCardId, setIsSavingUnsettingCardId] = useState(null);

  const router = useRouter();

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
          console.warn("User not authenticated, redirecting to login.");
          setUser(null);
          router.push('/login'); 
        } else {
          const errorBody = await res.json().catch(() => ({}));
          console.error("Login check failed with status:", res.status, errorBody.error || res.statusText);
          setUserAuthError("Unable to verify login status. Please try again.");
          setUser(null);
        }
      } catch (err) {
        console.error("Login check network or unexpected error:", err);
        setUserAuthError("Network error during login check. Please check your connection.");
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    checkLogin();
  }, [router, NEXT_PUBLIC_API_URL]);

  useEffect(() => {
    if (user && !loadingUser) {
      const fetchSavedMovies = async () => {
        setLoadingSavedMovies(true);
        setSavedMoviesError(null);
        setSavedMovies([]); 
        setUserSavedMovieIds([]); 

        try {
          const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/users/me/movies`, {
            credentials: 'include',
          });

          if (res.ok) {
            const data = await res.json();
             if (data && Array.isArray(data.movies)) {
              setSavedMovies(data.movies); 
              
              setUserSavedMovieIds(data.movies.map(movie => movie._id));
            } else {
               setSavedMoviesError("Received unexpected data format for saved movies.");
            }
          } else if (res.status === 401) {
              setUser(null);
             setSavedMoviesError("You are not authorized to view saved movies. Please log in.");
             router.push('/login');
          }
          else {
            const errorBody = await res.json().catch(() => ({}));
             setSavedMoviesError(`Failed to load saved movies: ${errorBody.error || 'Unknown error'}`);
          }
        } catch (err) {
           setSavedMoviesError("Network error while loading saved movies. Please check your connection.");
        } finally {
          setLoadingSavedMovies(false);
        }
      };

      fetchSavedMovies();
    } else if (!user && !loadingUser) {
        
        setSavedMovies([]);
        setUserSavedMovieIds([]);
        setSavedMoviesError(null);
        setLoadingSavedMovies(false);
    }
  }, [user, loadingUser, router, NEXT_PUBLIC_API_URL]);


  const handleToggleSavedStatus = useCallback(async (movieId) => {
     
    if (!user || !movieId) {
        alert("You must be logged in to save/unsave movies.");
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
            console.error(`Failed to ${isCurrentlySaved ? 'remove' : 'add'} movie:`, response.status, errorBody.error || response.statusText);
              
        } else {
            if (isCurrentlySaved) {
                
                setUserSavedMovieIds(prevIds => prevIds.filter(id => id !== movieId));
                 setSavedMovies(prevMovies => prevMovies.filter(movie => movie._id !== movieId));

            } else {
                
                setUserSavedMovieIds(prevIds => [...prevIds, movieId]);
            }
          }

    } catch (error) {
        console.error(`An error occurred during ${isCurrentlySaved ? 'remove' : 'add'} movie fetch:`, error);
     } finally {
        
        setIsSavingUnsettingCardId(null);
    }
  }, [user, userSavedMovieIds, NEXT_PUBLIC_API_URL]); 

  
  const handleLogout = async () => {
    try {
      const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        setUser(null); 
        setSavedMovies([]); 
        setUserSavedMovieIds([]); 
        setSavedMoviesError(null);
        router.push('/'); 
       } else {
        const data = await res.json().catch(() => ({}));
        }
    } catch (err) {
      }
  };

  const handleLoginSuccess = useCallback((loggedInUser) => {
    console.log("Login success handler called.", loggedInUser); 
    setUser(loggedInUser); 
    
    
    router.replace(router.asPath); 
}, [router]); 


  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-200">
        Loading user data…
      </div>
    );
  }

  if (userAuthError) {
       return (
        <div className="min-h-screen flex flex-col bg-gray-900 text-white">
            <Navbar user={user} onLogout={handleLogout} handleLoginSuccess={handleLoginSuccess} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 py-8">
                <h1 className="text-2xl sm:text-4xl text-white font-bold text-center mb-8 tracking-tight">My Saved Movies</h1>
                <div className="text-center text-red-400 bg-red-900/30 border border-red-700 rounded-md py-6 px-4 mb-6">
                    {userAuthError}
                </div>
            </main>
            <Footer />
        </div>
       );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-300 text-white">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-grow container mx-auto px-4 sm:px-6 py-8">
           <h1 className="text-2xl sm:text-4xl text-white font-bold text-center mb-8 tracking-tight">My Saved Movies</h1>
           <div className="text-center text-gray-500 py-10">
             Please log in to see your saved movies.
           </div>
        </main>
         <Footer />
      </div>
    );
  }


  
  return (
    <div className="min-h-screen flex flex-col bg-indigo-500/25 text-yellow-500 font-bold">

      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8">
        <h1 className=" lg:text-3xl md:text-3xl text-center mb-16 tracking-tight m-10">My Saved Movies</h1>

        {loadingSavedMovies ? (
          <div className="text-center text-gray-500 py-10">Loading saved movies...</div>
        ) : savedMoviesError ? (
          <div className="text-center text-red-400 bg-red-900/30 border border-red-700 rounded-md py-6 px-4 mb-6">
             {savedMoviesError}
          </div>
        ) : savedMovies.length > 0 ? (

          <MovieGrid
            movies={savedMovies}
            user={user} 
            userSavedMovieIds={userSavedMovieIds} 
            onToggleSavedStatus={handleToggleSavedStatus} 
            isSavingUnsettingCardId={isSavingUnsettingCardId} 
            isSavedList={false} 
          />
        ) : (
          <div className="text-center text-gray-500 py-10">
            You have no saved movies yet. Browse the <Link href="/" className="text-blue-400 hover:underline">homepage</Link> to add some!
          </div>
        )}

      </main>

      <Footer />

    </div>
  );
}