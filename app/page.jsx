"use client";
import { useState, useEffect, useRef } from "react";
import MovieGrid from "@/components/movie-grid/page";
import Header from '@/components/header/page';
import Footer from '@/components/footer/page';
 import Hero from "@/components/hero/page"

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const modalRef = useRef(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch(`/api/movies?search=${searchTerm}&category=${categoryFilter}`);
        if (!response.ok) throw new Error("Failed to fetch movies");
        const data = await response.json();
        setMovies(data.movies);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setError("Failed to load movies.");
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [searchTerm, categoryFilter]);

  async function addComment() {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Doe",
        email: "john_doe@example.com",
        movie_id: "573a1391f29313caabcd8543",
        text: "This is a great movie!",
      }),
    });
  
    const data = await response.json();
    console.log(data);
  }
  
  return (
    <div className="bg-gray-50 text-black flex flex-col font-serif">
      <div className="container mx-auto p">

      <Header />
      <Hero /> 
      <p className="text-lg mx-auto text-white-900/75  bg-gradient-to-r from-indigo-200/50 to-white/50  ">
              Browse a variety of MongoDB hand picked movies
            </p>
      <div className="flex justify-between items-center ">
      <h1 className="text-3xl font-bold ">Mongo sample_mflix movie database</h1>
    
      <div className="flex justify-between items-center mb-6">

          <input
            type="text"
            placeholder="Search for movies..."
            className="border text-black px-4 py-2 rounded-lg bg-gradient-to-r from-white/50 to-indigo-200/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
       </div>
       </div>

        <section className="mt-8">
          {loading ? <div>Loading...</div> : error ? <div>{error}</div> : <MovieGrid movies={movies} />}
        </section>
        <Footer />

      </div>
    </div>
  );
}
