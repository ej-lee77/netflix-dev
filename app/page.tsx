"use client";
import CategoryList from "@/components/main/CategoryList";
import Release from "@/components/main/Release";
import Hero from "@/components/Hero";
import MovieCarousel from "@/components/main/MovieCarousel";
import MovieList from "@/components/MovieList";
import TvList from "@/components/TvList";
import WatchingList from "@/components/main/WatchingList";
import NetflixOriginal from "@/components/main/NetflixOriginal";
import { useMovieStore } from "@/store/useMovieStore";
import { useEffect } from "react";

export default function Home() {
  const { onFetchPopular, onFetchTvs } = useMovieStore();
  useEffect(() => {
    onFetchPopular();
    onFetchTvs();
  }, []);

  return (
    <div className="inner">
      <Hero />
      <MovieCarousel />
      {/* 메인 타이틀 컴포넌트 자리 (디자인 대기) */}

      {/* 시청중 */}
      <WatchingList />

      {/* 넷플릭스 오리지널 시리즈 + 하단 조각 배너 */}
      <NetflixOriginal />


      <Release />
      <CategoryList category="movie" />
    </div>
  );
}