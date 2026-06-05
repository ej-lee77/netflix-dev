"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

interface Genre {
  id: number;
  name: string;
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "YOUR_TMDB_API_KEY";

const getBackdropUrl = (path: string) => `${TMDB_IMAGE_BASE}/original${path}`;
const getW780Url = (path: string) => `${TMDB_IMAGE_BASE}/w780${path}`;

function GenreBadge({ name }: { name: string }) {
  return (
    <span className="px-3 py-1 rounded-full text-[0.68rem] font-semibold tracking-widest uppercase bg-white/10 border border-white/20 text-slate-300 whitespace-nowrap">
      {name}
    </span>
  );
}

function CenterCard({
  movie,
  genres: allGenres,
  transitioning,
}: {
  movie: Movie;
  genres: Genre[];
  transitioning: boolean;
}) {
  const movieGenres = allGenres.filter((g) => movie.genre_ids.includes(g.id)).slice(0, 3);
  const year = movie.release_date?.split("-")[0] ?? "";

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden transition-all duration-400 shadow-2xl ${transitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
        }`}
      style={{ aspectRatio: "16/8" }}
    >
      {/* Backdrop */}
      {movie.backdrop_path && (
        <img
          src={getBackdropUrl(movie.backdrop_path)}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

      {/* Glass info panel */}
      <div className="absolute bottom-6 left-7 right-7">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-7 py-5 flex flex-col gap-3">
          {/* Title */}
          <h2 className="text-[1.65rem] font-extrabold text-slate-50 leading-tight tracking-tight">
            {movie.title}
          </h2>

          {/* Meta */}
          <div className="flex items-center gap-3 flex-wrap">
            {year && <span className="text-xs text-white/40">{year}</span>}
            <div className="flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#F5C518">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-bold text-yellow-400">
                {movie.vote_average.toFixed(1)}
              </span>
            </div>
            <div className="flex gap-2">
              {movieGenres.map((g) => (
                <GenreBadge key={g.id} name={g.name} />
              ))}
            </div>
          </div>

          {/* Overview */}
          <p className="text-[0.82rem] text-white/55 leading-relaxed line-clamp-2">
            {movie.overview}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 mt-1">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-white text-black text-sm font-bold tracking-wide hover:bg-white/90 transition-colors cursor-pointer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              재생
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-white/25 bg-white/10 text-slate-100 text-sm font-semibold hover:bg-white/20 transition-colors cursor-pointer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              상세 정보
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SideCard({ movie, onClick }: { movie: Movie; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative w-full rounded-xl overflow-hidden cursor-pointer brightness-50 hover:brightness-75 transition-[filter] duration-250"
      style={{ aspectRatio: "16/8" }}
    >
      {movie.backdrop_path ? (
        <img
          src={getW780Url(movie.backdrop_path)}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-slate-900" />
      )}
      {/* Bottom title */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-sm font-bold text-slate-100 leading-tight line-clamp-1">
          {movie.title}
        </p>
      </div>
    </div>
  );
}

function DotIndicators({
  total,
  active,
  onDotClick,
}: {
  total: number;
  active: number;
  onDotClick: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className={`h-[7px] rounded-full border-none cursor-pointer transition-all duration-300 p-0 ${i === active ? "w-6 bg-slate-100" : "w-[7px] bg-white/30"
            }`}
        />
      ))}
    </div>
  );
}

export default function MovieCarousel() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${TMDB_API_BASE}/genre/movie/list?api_key=${TMDB_API_KEY}&language=ko-KR`)
      .then((r) => r.json())
      .then((d) => setGenres(d.genres ?? []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`${TMDB_API_BASE}/trending/movie/week?api_key=${TMDB_API_KEY}&language=ko-KR`)
      .then((r) => r.json())
      .then((d) => {
        const filtered = (d.results ?? []).filter(
          (m: Movie) => m.backdrop_path && m.poster_path
        );
        setMovies(filtered.slice(0, 10));
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (transitioning || index === activeIndex) return;
      setTransitioning(true);
      setActiveIndex((index + movies.length) % movies.length);
      setTimeout(() => setTransitioning(false), 420);
    },
    [activeIndex, movies.length, transitioning]
  );

  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    if (!movies.length) return;
    autoPlayRef.current = setInterval(next, 6000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [movies.length, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const activeMovie = movies[activeIndex];
  const prevMovie = movies[(activeIndex - 1 + movies.length) % movies.length];
  const nextMovie = movies[(activeIndex + 1) % movies.length];

  const startAutoPlay = useCallback(() => {
    autoPlayRef.current = setInterval(next, 6000);
  }, [next]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  }, []);

  if (loading) {
    return (
      <section className="w-full py-10">
        <div className="max-w-[1600px] mx-auto px-10">
          <div className="w-full rounded-2xl bg-slate-800 animate-pulse" style={{ aspectRatio: "16/8" }} />
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full py-10"
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      {/* Header row */}
      <div className="max-w-[1600px] mx-auto px-10 mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-400 tracking-[0.1em] uppercase">
          추천
        </h2>
        <div className="flex items-center gap-2">
          <DotIndicators
            total={movies.length}
            active={activeIndex}
            onDotClick={goTo}
          />
          {/* Arrow buttons */}
          {[
            { label: "이전", action: prev, d: "M15 18l-6-6 6-6" },
            { label: "다음", action: next, d: "M9 18l6-6-6-6" },
          ].map(({ label, action, d }) => (
            <button
              key={label}
              onClick={action}
              aria-label={label}
              className="w-9 h-9 rounded-full border border-white/20 bg-white/5 text-white flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={d} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* 3-column grid */}
      <div className="max-w-[1600px] mx-auto px-10 grid grid-cols-[1fr_1.65fr_1fr] gap-4 items-center">
        {prevMovie && <SideCard movie={prevMovie} onClick={prev} />}
        {activeMovie && (
          <CenterCard movie={activeMovie} genres={genres} transitioning={transitioning} />
        )}
        {nextMovie && <SideCard movie={nextMovie} onClick={next} />}
      </div>
    </section>
  );
}