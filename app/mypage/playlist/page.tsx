"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePlayListStore } from "@/store/usePlayListStore";
import "../../scss/mediaList.scss";

type FilterType = "all" | "movie" | "tv";

export default function PlaylistPage() {
  const { playList, onLoadPlayList } = usePlayListStore();
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    onLoadPlayList();
  }, [onLoadPlayList]);

  const items = playList;
  const filtered = filter === "all" ? items : items.filter((item) => item.mediaType === filter);
  const movieCount = items.filter((item) => item.mediaType === "movie").length;
  const tvCount = items.filter((item) => item.mediaType === "tv").length;

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
                  <button className="icon-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    ⋯
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <p>재생한 작품이 없어요.</p>
            <Link href="/" className="btn-primary">작품 둘러보기</Link>
          </div>
        )}
      </div>
    </div>
  );
}
