"use client";
import NewMovieList from "@/components/main/NewMovieList";
import RisingMovieList from "@/components/main/RisingMovieList";
import CategoryList from "@/components/main/CategoryList";
import Release from "@/components/main/Release";
import WatchingList from "@/components/main/WatchingList";
import NetflixOriginal from "@/components/main/NetflixOriginal";
import RecommendList from "@/components/main/RecommendList";
import { useMovieStore } from "@/store/useMovieStore";
import { useEffect } from "react";
import Hero from "@/components/main/Hero";

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
      {/* 랭킹 */}
      {/* 시청중 */}
      <WatchingList />
      {/* 넷플릭스 오리지널 시리즈 + 하단 조각 배너 */}
      <NetflixOriginal />
      {/* 신작 */}
      <NewMovieList />
      {/* 급상승 */}
      <RisingMovieList />
      {/* 추천 + TOP CAST */}
      <RecommendList />
      {/* 공개예정 */}
      <Release />
      {/* 카테고리 */}
      <CategoryList category="movie" />
      <CategoryList category="tv" />
    </div>
  );
}
