"use client";
import NewMovieList from "@/components/main/NewMovieList";
import RisingMovieList from "@/components/main/RisingMovieList";
import CategoryList from "@/components/main/CategoryList";
import ThemeRow, { type ThemeItem } from "@/components/main/ThemeRow";
import ThemeRowSkeleton from "@/components/main/ThemeRowSkeleton";
import RankingSection, { type RankingItem } from "@/components/main/RankingSection";
import SplitBanner from "@/components/main/SplitBanner";
import Release from "@/components/main/Release";
import WatchingList from "@/components/main/WatchingList";
import NetflixOriginal from "@/components/main/NetflixOriginal";
import RecommendList from "@/components/main/RecommendList";
import { useMovieStore } from "@/store/useMovieStore";
import { useEffect, useState } from "react";
import Hero from "@/components/main/Hero";
import TopCast from "@/components/main/TopCast";
import MoodBanner from "@/components/main/MoodBanner";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const SPLIT_BANNER_AFTER = 3; // 일본 애니(2) 다음, 미국 TV(3) 앞
const THEME_SPLIT = 5;        // 이 인덱스 이후에 한국 시리즈 랭킹 삽입
const RELEASE_AFTER = 9;      // 이 인덱스 이후에 공개예정 섹션 삽입

const THEME_CONFIGS: { title: string; apiUrl: string; mediaType: "movie" | "tv"; pageCount?: number; href: string }[] = [
  {
    title: "한국 액션 & 어드벤처 시리즈",
    apiUrl: "https://api.themoviedb.org/3/discover/tv?language=ko-KR&with_original_language=ko&with_genres=10759&sort_by=popularity.desc",
    mediaType: "tv",
    href: "/genre/action",
  },
  {
    title: "아시아 시리즈",
    apiUrl: "https://api.themoviedb.org/3/discover/tv?language=ko-KR&with_origin_country=KR%7CJP%7CCN%7CTW&sort_by=popularity.desc",
    mediaType: "tv",
    href: "/category",
  },
  {
    title: "일본 애니 시리즈",
    apiUrl: "https://api.themoviedb.org/3/discover/tv?language=ko-KR&with_original_language=ja&with_genres=16&sort_by=popularity.desc",
    mediaType: "tv",
    href: "/genre/animation",
  },
  {
    title: "미국 TV 프로그램",
    apiUrl: "https://api.themoviedb.org/3/discover/tv?language=ko-KR&with_original_language=en&sort_by=popularity.desc",
    mediaType: "tv",
    href: "/category",
  },
  {
    title: "액션 영화",
    apiUrl: "https://api.themoviedb.org/3/discover/movie?language=ko-KR&with_genres=28&sort_by=popularity.desc",
    mediaType: "movie",
    href: "/genre/action",
  },
  {
    title: "범죄 드라마",
    apiUrl: "https://api.themoviedb.org/3/discover/movie?language=ko-KR&with_genres=80&sort_by=popularity.desc",
    mediaType: "movie",
    href: "/genre/thriller",
  },
  {
    title: "한국 로맨스 시리즈",
    apiUrl: "https://api.themoviedb.org/3/discover/tv?language=ko-KR&with_original_language=ko&with_genres=10749&sort_by=popularity.desc",
    mediaType: "tv",
    href: "/genre/romance",
  },
  {
    title: "모험 애니메이션",
    apiUrl: "https://api.themoviedb.org/3/discover/tv?language=ko-KR&with_original_language=ja&with_genres=16%2C10759&sort_by=popularity.desc",
    mediaType: "tv",
    pageCount: 3,
    href: "/genre/animation",
  },
  {
    title: "해외 코미디 시리즈",
    apiUrl: "https://api.themoviedb.org/3/discover/tv?language=ko-KR&with_original_language=en&with_genres=35&sort_by=popularity.desc",
    mediaType: "tv",
    href: "/genre/comedy",
  },
  {
    title: "판타지 영화",
    apiUrl: "https://api.themoviedb.org/3/discover/movie?language=ko-KR&with_genres=14&sort_by=popularity.desc",
    mediaType: "movie",
    href: "/genre/fantasy",
  },
  {
    title: "오늘 가장 많이보는 시리즈",
    apiUrl: "https://api.themoviedb.org/3/trending/tv/day?language=ko-KR",
    mediaType: "tv",
    href: "/category",
  },
];

async function fetchCert(id: number, mediaType: "movie" | "tv"): Promise<string> {
  if (mediaType === "movie") {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/release_dates?api_key=${TMDB_KEY}`);
    const data = await res.json();
    const kr = (data.results ?? []).find((r: any) => r.iso_3166_1 === "KR");
    return kr?.release_dates?.[0]?.certification ?? "";
  } else {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/content_ratings?api_key=${TMDB_KEY}`);
    const data = await res.json();
    const kr = (data.results ?? []).find((r: any) => r.iso_3166_1 === "KR");
    return kr?.rating ?? "";
  }
}

async function fetchThemeItems(apiUrl: string, mediaType: "movie" | "tv", pageCount = 1): Promise<ThemeItem[]> {
  const MIN_ITEMS = 9;
  const startPage = Math.floor(Math.random() * 3) + 1;
  const pages = await Promise.all(
    Array.from({ length: Math.max(pageCount, 2) }, (_, i) =>
      fetch(`${apiUrl}&page=${startPage + i}&api_key=${TMDB_KEY}`).then((r) => r.json())
    )
  );
  const allResults = pages.flatMap((data) => data.results || []);
  const seen = new Set<number>();
  const unique = allResults
    .filter((item: any) => seen.has(item.id) ? false : (seen.add(item.id), true))
    .sort(() => Math.random() - 0.5);

  const rawItems: ThemeItem[] = unique.map((item: any) => ({
    id: item.id,
    title: item.title ?? item.name,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    overview: item.overview,
    release_date: item.release_date ?? item.first_air_date,
    genre_ids: item.genre_ids ?? [],
    mediaType,
  }));

  // 모든 아이템의 연령 정보를 병렬로 fetch
  const certs = await Promise.all(rawItems.map((item) => fetchCert(item.id, mediaType)));

  // Zustand store에 미리 저장해두면 hover 시 바로 표시됨
  const certMap: Record<string, string> = {};
  certs.forEach((cert, i) => { certMap[`${mediaType}-${rawItems[i].id}`] = cert; });
  useMovieStore.setState((state) => ({
    certifications: { ...state.certifications, ...certMap },
  }));

  const withCert = rawItems.filter((_, i) => certs[i] !== "");
  if (withCert.length >= MIN_ITEMS) return withCert;

  // 9개 미만이면 인증 없는 아이템으로 채워서 최소 9개 보장
  const withoutCert = rawItems.filter((_, i) => certs[i] === "");
  return [...withCert, ...withoutCert.slice(0, MIN_ITEMS - withCert.length)];
}

export default function Home() {
  const { onFetchPopular, onFetchTvs, onFetchNewest, onFetchTrending, onFetchNetflixOriginals, onFetchKoreanMovies } = useMovieStore();
  const [themeRows, setThemeRows] = useState<ThemeItem[][]>([]);
  const [themeLoading, setThemeLoading] = useState(true);
  const [koreanSeries, setKoreanSeries] = useState<RankingItem[]>([]);
  const [koreanMovieRanking, setKoreanMovieRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    onFetchPopular();
    onFetchTvs();
    onFetchNewest();
    onFetchTrending();
    onFetchNetflixOriginals();
    onFetchKoreanMovies();
  }, []);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/discover/tv?language=ko-KR&with_original_language=ko&without_genres=10764%2C10767&first_air_date.gte=2025-01-01&sort_by=popularity.desc&page=1&api_key=${TMDB_KEY}`)
      .then((r) => r.json())
      .then((data) => {
        const items: RankingItem[] = (data.results || [])
          .filter((t: any) => t.poster_path && t.backdrop_path)
          .slice(0, 10)
          .map((t: any) => ({
            id: t.id,
            title: t.name,
            poster_path: t.poster_path,
            backdrop_path: t.backdrop_path,
            vote_average: t.vote_average,
            overview: t.overview,
            media_type: "tv" as const,
          }));
        setKoreanSeries(items);
      });
  }, []);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/discover/tv?language=ko-KR&with_original_language=ko&with_genres=10764%7C10767&sort_by=popularity.desc&page=1&api_key=${TMDB_KEY}`)
      .then((r) => r.json())
      .then((data) => {
        const items: RankingItem[] = (data.results || [])
          .filter((m: any) => m.poster_path && m.backdrop_path)
          .slice(0, 10)
          .map((m: any) => ({
            id: m.id,
            title: m.name,
            poster_path: m.poster_path,
            backdrop_path: m.backdrop_path,
            vote_average: m.vote_average,
            overview: m.overview,
            media_type: "tv" as const,
          }));
        setKoreanMovieRanking(items);
      });
  }, []);

  useEffect(() => {
    Promise.all(THEME_CONFIGS.map((c) => fetchThemeItems(c.apiUrl, c.mediaType, c.pageCount))).then((allRows) => {
      const usedIds = new Set<number>();
      const deduped = allRows.map((row) => {
        const filtered = row.filter((item) => !usedIds.has(item.id)).slice(0, 18);
        filtered.forEach((item) => usedIds.add(item.id));
        return filtered;
      });
      setThemeRows(deduped);
      setThemeLoading(false);
    });
  }, []);

  return (
    <div className="main-page-wrap">
      <Hero />
      {/* 랭킹 */}
      <RankingSection />
      {/* 기분 배너 */}
      <MoodBanner />
      {/* 시청중 */}
      <WatchingList />
      {/* 넷플릭스 오리지널 시리즈 + 하단 조각 배너 */}
      {/* <NetflixOriginal /> */}
      {/* 넷플릭스 시리즈 */}
      <CategoryList category="netflix" />
      {/* 신작 */}
      {/* <NewMovieList /> */}
      {/* 급상승 */}
      {/* <RisingMovieList /> */}
      {/* 추천 */}
      <RecommendList />
      {/* <TopCast /> */}
      {/* 테마별 카테고리 — 앞부분 앞 (일본 애니까지) */}
      {themeLoading
        ? THEME_CONFIGS.slice(0, SPLIT_BANNER_AFTER).map((config) => <ThemeRowSkeleton key={config.title} />)
        : THEME_CONFIGS.slice(0, SPLIT_BANNER_AFTER).map((config, i) =>
            themeRows[i]?.length > 0 ? (
              <ThemeRow key={config.title} title={config.title} items={themeRows[i]} href={config.href} />
            ) : null
          )
      }
      {/* 스플릿 배너 */}
      <SplitBanner />
      {/* 테마별 카테고리 — 앞부분 뒤 (미국 TV ~ 액션 영화) */}
      {themeLoading
        ? THEME_CONFIGS.slice(SPLIT_BANNER_AFTER, THEME_SPLIT).map((config) => <ThemeRowSkeleton key={config.title} />)
        : THEME_CONFIGS.slice(SPLIT_BANNER_AFTER, THEME_SPLIT).map((config, i) =>
            themeRows[SPLIT_BANNER_AFTER + i]?.length > 0 ? (
              <ThemeRow key={config.title} title={config.title} items={themeRows[SPLIT_BANNER_AFTER + i]} href={config.href} />
            ) : null
          )
      }
      {/* 중간 랭킹: 한국 시리즈 TOP 10 */}
      {koreanSeries.length > 0 && (
        <RankingSection title="한국 시리즈 TOP 10" items={koreanSeries} />
      )}
      {/* 테마별 카테고리 — 뒷부분 앞 (해외 코미디까지) */}
      {themeLoading
        ? THEME_CONFIGS.slice(THEME_SPLIT, RELEASE_AFTER).map((config) => <ThemeRowSkeleton key={config.title} />)
        : THEME_CONFIGS.slice(THEME_SPLIT, RELEASE_AFTER).map((config, i) =>
            themeRows[THEME_SPLIT + i]?.length > 0 ? (
              <ThemeRow key={config.title} title={config.title} items={themeRows[THEME_SPLIT + i]} href={config.href} />
            ) : null
          )
      }
      {/* 공개예정 */}
      <Release />
      {/* 테마별 카테고리 — 뒷부분 뒤 (판타지 영화부터) */}
      {themeLoading
        ? THEME_CONFIGS.slice(RELEASE_AFTER).map((config) => <ThemeRowSkeleton key={config.title} />)
        : THEME_CONFIGS.slice(RELEASE_AFTER).map((config, i) =>
            themeRows[RELEASE_AFTER + i]?.length > 0 ? (
              <ThemeRow key={config.title} title={config.title} items={themeRows[RELEASE_AFTER + i]} href={config.href} />
            ) : null
          )
      }
      {/* 오늘의 대한민국 TOP 10 영화 */}
      {koreanMovieRanking.length > 0 && (
        <RankingSection title="오늘의 대한민국 TOP 10 예능" items={koreanMovieRanking} />
      )}
    </div>
  );
}
