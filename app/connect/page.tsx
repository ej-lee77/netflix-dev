"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCommunityEnabled } from "@/data/maturityFilter";
import ConnectHero from "@/components/connect/ConnectHero";
import ConnectFollowingUsers from "@/components/connect/ConnectFollowingUsers";
import ConnectFollowingPlaylists from "@/components/connect/ConnectFollowingPlaylists";
import ConnectFriendReactions from "@/components/connect/ConnectFriendReactions";
import ConnectReviewList from "@/components/connect/ConnectReviewList";
import RankingSection, { type RankingItem } from "@/components/main/RankingSection";
import ThemeRow, { type ThemeItem } from "@/components/main/ThemeRow";
import ThemeRowSkeleton from "@/components/main/ThemeRowSkeleton";
import { useMovieStore } from "@/store/useMovieStore";
import type { Movie } from "@/types/movie";

const hasKorean = (text: string) => /[가-힣]/.test(text);

function toThemeItems(movies: Movie[], mediaType: "movie" | "tv"): ThemeItem[] {
  return movies
    .filter((m) => m.poster_path && m.backdrop_path && hasKorean(m.title ?? m.name ?? ""))
    .map((m) => ({
      id: m.id,
      title: m.title ?? m.name ?? "",
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      vote_average: m.vote_average,
      overview: m.overview,
      release_date: m.release_date,
      genre_ids: m.genre_ids ?? [],
      mediaType,
    }));
}

function toRankingItems(movies: Movie[]): RankingItem[] {
  return movies
    .filter((m) => m.poster_path && m.backdrop_path && hasKorean(m.title))
    .slice(0, 10)
    .map((m) => ({
      id: m.id,
      title: m.title,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      vote_average: m.vote_average,
      overview: m.overview,
      media_type: "movie" as const,
    }));
}

export default function ConnectPage() {
  const {
    trendingMovies, onFetchTrending,
    popMovies, onFetchPopular,
    newMovies, onFetchNewest,
  } = useMovieStore();

  const router = useRouter();
  // isCommunity 비활성(12세 이하 포함) 프로필은 커넥트 접근 차단
  const communityEnabled = useCommunityEnabled();

  useEffect(() => {
    if (!communityEnabled) router.replace("/");
  }, [communityEnabled, router]);

  useEffect(() => {
    if (!trendingMovies.length) onFetchTrending();
    if (!popMovies.length) onFetchPopular();
    if (!newMovies.length) onFetchNewest();
  }, []);

  const rankingItems = useMemo(() => toRankingItems(popMovies), [popMovies]);
  const trendingItems = useMemo(() => toThemeItems(trendingMovies, "movie"), [trendingMovies]);
  const newItems = useMemo(() => toThemeItems(newMovies, "movie"), [newMovies]);

  if (!communityEnabled) return null;

  return (
    <div className="main-page-wrap">
      <ConnectHero />

      {/* 소셜: 팔로우하는 유저 */}
      <ConnectFollowingUsers />

      {/* OTT: 멤버들이 많이 보는 TOP 10 (글로벌 인기 기반) */}
      <RankingSection title="커넥트 멤버들의 TOP 10" items={rankingItems} />

      {/* 소셜: 추천 플레이리스트 */}
      <ConnectFollowingPlaylists />

      {/* 소셜: 친구들의 한줄 리뷰 */}
      <ConnectFriendReactions />

      {/* OTT: 팔로우 취향 저격 (트렌딩 기반) */}
      {trendingItems.length > 0 ? (
        <ThemeRow title="팔로우 취향 저격 작품" items={trendingItems} href="/category" />
      ) : (
        <ThemeRowSkeleton />
      )}

      {/* 소셜: 나와 취향이 비슷한 유저 */}
      <ConnectReviewList />

      {/* OTT: 지금 커넥트에서 핫한 (최신 개봉 기반) */}
      {newItems.length > 0 ? (
        <ThemeRow title="지금 커넥트에서 핫한 작품" items={newItems} href="/category" />
      ) : (
        <ThemeRowSkeleton />
      )}
    </div>
  );
}
