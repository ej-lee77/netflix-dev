"use client";
import NewMovieList from "@/components/main/NewMovieList";
import RisingMovieList from "@/components/main/RisingMovieList";
import MovieList from "@/components/MovieList";
import TvList from "@/components/TvList";
import { useMovieStore } from "@/store/useMovieStore";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  const { onFetchPopular, onFetchTvs, onFetchNewest, onFetchTrending } = useMovieStore();
  useEffect(() => {
    onFetchPopular();
    onFetchTvs();
    onFetchNewest();
    onFetchTrending();
  }, []);
  return (
    <div className="inner">

      {/* <MovieList /> */}
      <TvList />
      <NewMovieList />
      <RisingMovieList />
    </div>
  );
}
