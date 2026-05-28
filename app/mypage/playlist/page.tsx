"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePlayListStore } from "@/store/usePlayListStore";
import { useMovieStore } from "@/store/useMovieStore";
import { useAuthStore } from "@/store/useAuthStore";
import "../../scss/mediaList.scss";

type FilterType = "all" | "movie" | "tv";

export default function PlaylistPage() {
  const { playList, onLoadPlayList } = usePlayListStore();
  const { popMovies, onFetchPopular } = useMovieStore();
  const { currentProfile } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const profileOffset = Math.max((currentProfile?.id ?? 1) - 1, 0);

  useEffect(() => {
    onLoadPlayList();
    if (popMovies.length === 0) onFetchPopular();
  }, []);

  // 실제 PlayList가 비어있으면 데모로 popular movies 표시
  const profilePlayList = [
    ...playList.slice(profileOffset),
    ...playList.slice(0, profileOffset),
  ];
  const profileMovies = [
    ...popMovies.slice(profileOffset),
    ...popMovies.slice(0, profileOffset),
  ];

  const items = profilePlayList.length > 0
    ? profilePlayList
    : profileMovies.slice(0, 8).map((m) => ({
        id: m.id,
        title: m.title,
        poster_path: m.poster_path,
        mediaType: "movie" as const,
        playTime: new Date().toISOString(),
      }));

  const filtered = filter === "all" ? items : items.filter((i) => i.mediaType === filter);
  const movieCount = items.filter((i) => i.mediaType === "movie").length;
  const tvCount = items.filter((i) => i.mediaType === "tv").length;

  return (
    <div className="media-list-page">
      <div className="inner">
        <div className="page-head">
          <h1>재생목록</h1>
          <p>최근 시청한 작품 {items.length}개</p>
        </div>

        <div className="filter-row">
          <div className="filter-chips">
            <button
              className={filter === "all" ? "chip active" : "chip"}
              onClick={() => setFilter("all")}
            >
              전체 {items.length}
            </button>
            <button
              className={filter === "movie" ? "chip active" : "chip"}
              onClick={() => setFilter("movie")}
            >
              영화 {movieCount}
            </button>
            <button
              className={filter === "tv" ? "chip active" : "chip"}
              onClick={() => setFilter("tv")}
            >
              시리즈 {tvCount}
            </button>
          </div>
        </div>

        {filtered.length > 0 ? (
          <ul className="history-list">
            {filtered.map((item) => (
              <li key={`${item.mediaType}-${item.id}`} className="history-item">
                <Link href={`/detail/${item.mediaType}/${item.id}`} className="history-link">
                  <div className="thumb">
                    {item.poster_path && (
                      <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.title} />
                    )}
                    <div className="progress"></div>
                  </div>
                  <div className="info">
                    <span className="type-tag">{item.mediaType === "movie" ? "영화" : "TV"}</span>
                    <h3>{item.title}</h3>
                    <p className="watched-at">
                      {new Date(item.playTime).toLocaleDateString("ko-KR")}
                    </p>
                    <span className="progress-text">시청 중 · 이어보기</span>
                  </div>
                  <button className="icon-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>⋯</button>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <p>재생한 작품이 없어요</p>
            <Link href="/" className="btn-primary">작품 둘러보기</Link>
          </div>
        )}
      </div>
    </div>
  );
}
