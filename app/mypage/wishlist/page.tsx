"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMovieStore } from "@/store/useMovieStore";
import { useAuthStore } from "@/store/useAuthStore";
import "../../scss/mediaList.scss";

type FilterType = "all" | "movie" | "tv";
type SortType = "recent" | "title" | "rating";

export default function WishlistPage() {
  const { popMovies, tvs, onFetchPopular, onFetchTvs } = useMovieStore();
  const { currentProfile } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("recent");
  const profileOffset = Math.max((currentProfile?.id ?? 1) - 1, 0);

  useEffect(() => {
    if (popMovies.length === 0) onFetchPopular();
    if (tvs.length === 0) onFetchTvs();
  }, []);

  // 위시리스트는 실제로 firebase 연동이 필요하지만, 데모용으로 TMDB 데이터 사용
  const profileMovies = [
    ...popMovies.slice(profileOffset),
    ...popMovies.slice(0, profileOffset),
  ];
  const profileTvs = [
    ...tvs.slice(profileOffset),
    ...tvs.slice(0, profileOffset),
  ];

  const movieItems = profileMovies.slice(0, 8).map((m) => ({
    id: m.id,
    title: m.title,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    vote_average: m.vote_average,
    type: "movie" as const,
  }));

  const tvItems = profileTvs.slice(0, 8).map((t) => ({
    id: t.id,
    title: t.name,
    poster_path: t.poster_path,
    backdrop_path: t.backdrop_path,
    vote_average: t.vote_average,
    type: "tv" as const,
  }));

  let items = filter === "all" ? [...movieItems, ...tvItems] : filter === "movie" ? movieItems : tvItems;

  // 정렬
  if (sort === "title") {
    items = [...items].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "rating") {
    items = [...items].sort((a, b) => b.vote_average - a.vote_average);
  }

  return (
    <div className="media-list-page">
      <div className="inner">
        <div className="page-head">
          <h1>위시리스트</h1>
          <p>찜한 작품 {items.length}개</p>
        </div>

        <div className="filter-row">
          <div className="filter-chips">
            <button
              className={filter === "all" ? "chip active" : "chip"}
              onClick={() => setFilter("all")}
            >
              전체 {movieItems.length + tvItems.length}
            </button>
            <button
              className={filter === "movie" ? "chip active" : "chip"}
              onClick={() => setFilter("movie")}
            >
              영화 {movieItems.length}
            </button>
            <button
              className={filter === "tv" ? "chip active" : "chip"}
              onClick={() => setFilter("tv")}
            >
              시리즈 {tvItems.length}
            </button>
          </div>
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortType)}>
            <option value="recent">최근 찜한 순</option>
            <option value="title">제목순</option>
            <option value="rating">평점 높은순</option>
          </select>
        </div>

        {items.length > 0 ? (
          <div className="poster-grid">
            {items.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={`/detail/${item.type}/${item.id}`}
                className="poster-card"
              >
                <div className="poster">
                  {item.poster_path && (
                    <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.title} />
                  )}
                  <span className="type-tag">{item.type === "movie" ? "영화" : "TV"}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="rating">★ {item.vote_average.toFixed(1)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>아직 찜한 작품이 없어요</p>
            <Link href="/" className="btn-primary">작품 둘러보기</Link>
          </div>
        )}
      </div>
    </div>
  );
}
