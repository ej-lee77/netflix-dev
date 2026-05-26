"use client";
import MovieCarousel from "@/components/main/MovieCarousel";
import MovieList from "@/components/MovieList";
import TvList from "@/components/TvList";
import { useMovieStore } from "@/store/useMovieStore";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  const { onFetchPopular, onFetchTvs } = useMovieStore();
  useEffect(() => {
    onFetchPopular();
    onFetchTvs();
  }, []);
  return (
    <div className="inner">
      <MovieCarousel />
      <MovieList />
      <TvList />
    </div>
  );
}
