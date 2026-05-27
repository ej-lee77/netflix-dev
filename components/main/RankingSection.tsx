"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { useMovieStore } from "@/store/useMovieStore";

import "swiper/css";
import "swiper/css/free-mode";
import "./scss/rankingSection.scss";

const IMG_BASE = "https://image.tmdb.org/t/p/";

function imageUrl(path: string, size = "w500") {
  return `${IMG_BASE}${size}${path}`;
}

function getStars(rating: number) {
  const count = Math.round(rating / 2);
  return "★".repeat(count) + "☆".repeat(5 - count);
}

export default function RankingSection() {
  const { trendingMovies, onFetchTrending } = useMovieStore();

  const [activeId, setActiveId] = useState<number | null>(null);

  const swiperRef = useRef<SwiperClass | null>(null);

  useEffect(() => {
    if (!trendingMovies.length) {
      onFetchTrending();
    }
  }, [onFetchTrending, trendingMovies.length]);

  const rankingItems = useMemo(
    () =>
      trendingMovies
        .filter((movie) => movie.poster_path && movie.backdrop_path)
        .slice(0, 10),
    [trendingMovies],
  );

  useEffect(() => {
    if (!activeId && rankingItems[0]) {
      setActiveId(rankingItems[0].id);
    }
  }, [activeId, rankingItems]);

  const activeIndex = rankingItems.findIndex((movie) => movie.id === activeId);

  const selectRankingItem = (id: number, index: number) => {
    setActiveId(id);

    setTimeout(() => {
      const swiper = swiperRef.current;

      if (!swiper) return;

      swiper.update();

      swiper.slideTo(Math.max(index - 1, 0), 500);
    }, 0);
  };

  if (!rankingItems.length) {
    return (
      <section className="ranking-section">
        <h2 className="ranking-title">랭킹</h2>

        <div className="ranking-skeleton-row">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="ranking-skeleton-card" key={index} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="ranking-section">
      <h2 className="ranking-title">랭킹</h2>

      <div className="ranking-swiper-wrap">
        <Swiper
          modules={[FreeMode]}
          freeMode={false}
          slidesPerView="auto"
          spaceBetween={18}
          watchSlidesProgress
          observer
          observeParents
          className="ranking-swiper"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {rankingItems.map((movie, index) => {
            const isActive = movie.id === activeId;

            return (
              <SwiperSlide
                className={`ranking-slide ${isActive ? "expanded" : ""}`}
                key={movie.id}
              >
                <button
                  type="button"
                  className={`ranking-card ${isActive ? "active" : ""}`}
                  onClick={() => selectRankingItem(movie.id, index)}
                >
                  <span className="ranking-card-poster">
                    <img
                      src={imageUrl(movie.poster_path, "w500")}
                      alt={movie.title}
                    />
                  </span>

                  <span className="ranking-card-gradient" />

                  <span className="ranking-card-rank">{index + 1}</span>

                  <span
                    className="ranking-card-detail"
                    style={{
                      backgroundImage: `linear-gradient(
                        90deg,
                        rgba(25, 23, 38, 0.95),
                        rgba(25, 23, 38, 0.78)
                      ),
                      url(${imageUrl(movie.backdrop_path, "w780")})`,
                    }}
                  >
                    <span className="ranking-detail-rank">#{index + 1}위</span>

                    <strong className="ranking-detail-title">
                      {movie.title}
                    </strong>

                    <span className="ranking-detail-score">
                      <em>{movie.vote_average.toFixed(1)}</em>

                      <span>{getStars(movie.vote_average)}</span>
                    </span>

                    <span className="ranking-detail-overview">
                      {movie.overview || "줄거리 정보가 없습니다."}
                    </span>

                    <span className="ranking-detail-actions">
                      <span>상세보기</span>
                      <span>재생</span>
                    </span>
                  </span>

                  <span className="ranking-card-compact">
                    <span className="ranking-card-score">{index + 1}위</span>

                    <span className="ranking-card-title">{movie.title}</span>
                  </span>
                </button>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      <div className="ranking-progress">
        <span
          style={{
            width: `${
              ((activeIndex >= 0 ? activeIndex + 1 : 1) / rankingItems.length) *
              100
            }%`,
          }}
        />
      </div>
    </section>
  );
}
