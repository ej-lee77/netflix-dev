"use client";
import NewMovieList from "@/components/main/NewMovieList";
import RisingMovieList from "@/components/main/RisingMovieList";
import CategoryList from "@/components/main/CategoryList";
import Release from "@/components/main/Release";
import MovieCarousel from "@/components/main/MovieCarousel";
import MovieList from "@/components/MovieList";
import TvList from "@/components/TvList";
import WatchingList from "@/components/main/WatchingList";
import NetflixOriginal from "@/components/main/NetflixOriginal";
import RecommendList from "@/components/main/RecommendList";
import { useMovieStore } from "@/store/useMovieStore";
import { useEffect } from "react";
import Hero from "@/components/main/Hero";
import TopCast from "@/components/main/TopCast";
import RankingSection from "@/components/main/RankingSection";

export default function Home() {
  const { onFetchPopular, onFetchTvs, onFetchNewest, onFetchTrending } =
    useMovieStore();
  useEffect(() => {
    onFetchPopular();
    onFetchTvs();
    onFetchNewest();
    onFetchTrending();
  }, []);

  return (
    <div>
      <Hero />
      <RankingSection />
      <MovieCarousel />
      {/* 메인 타이틀 컴포넌트 자리 (디자인 대기) */}

      {/* 시청중 */}
      <WatchingList />
      <NetflixOriginal />
      <RecommendList />
      <TopCast />

      {/* <MovieList /> */}
      <TvList />
      <NewMovieList />
      <RisingMovieList />

      <Release />
      <CategoryList category="movie" />
    </div>
  );
}
