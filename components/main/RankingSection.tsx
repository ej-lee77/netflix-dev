"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { KeyboardEvent, PointerEvent } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { useMovieStore } from "@/store/useMovieStore";
import type { Movie } from "@/types/movie";

import "swiper/css";
import "swiper/css/free-mode";
import "./scss/rankingSection.scss";
import SectionTitle from "../common/SectionTitle";

const IMG_BASE = "https://image.tmdb.org/t/p/";

function imageUrl(path: string, size = "w500") {
  return `${IMG_BASE}${size}${path}`;
}

function getStars(rating: number) {
  const count = Math.round(rating / 2);
  return "★".repeat(count) + "☆".repeat(5 - count);
}

export default function RankingSection() {
  const { koreanMovies, onFetchKoreanMovies } = useMovieStore();

  const [activeId, setActiveId] = useState<number | null>(null);

  const swiperRef = useRef<SwiperClass | null>(null);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const isSwiperDraggingRef = useRef(false);

  useEffect(() => {
    if (!koreanMovies.length) {
      onFetchKoreanMovies();
    }
  }, [onFetchKoreanMovies, koreanMovies.length]);

  const rankingItems = useMemo(
    () =>
      koreanMovies
        .filter((movie: Movie) => movie.poster_path && movie.backdrop_path)
        .slice(0, 10),
    [koreanMovies],
  );

  useEffect(() => {
    if (!activeId && rankingItems[0]) {
      setActiveId(rankingItems[0].id);
    }
  }, [activeId, rankingItems]);


  const selectRankingItem = (id: number, index: number) => {
    if (isDraggingRef.current || isSwiperDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    flushSync(() => {
      setActiveId(id);
    });

    window.requestAnimationFrame(() => {
      const swiper = swiperRef.current;

      if (!swiper) return;

      swiper.update();
      swiper.slideTo(Math.max(index - 1, 0), 420);
    });
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    id: number,
    index: number,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    selectRankingItem(id, index);
  };

  const handlePointerDown = (event: PointerEvent) => {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (event: PointerEvent) => {
    const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);

    if (deltaX > 6 || deltaY > 6) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerEnd = () => {};

  if (!rankingItems.length) {
    return (
      <section className="ranking-section">
        <SectionTitle title='방구석 TOP 10' subTitle='오늘 많이 보는 작품을 확인해보세요' />

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
      <div className="section-title-outer">
        <SectionTitle title='오늘의 넷플릭스 TOP 10' />
      </div>

      <div className="ranking-swiper-wrap">
        <Swiper
          modules={[FreeMode]}
          freeMode={false}
          grabCursor
          simulateTouch
          threshold={6}
          touchStartPreventDefault={false}
          slidesPerView="auto"
          spaceBetween={18}
          watchSlidesProgress
          observer
          observeParents
          className="ranking-swiper"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSliderMove={() => {
            isSwiperDraggingRef.current = true;
          }}
          onTouchMove={() => {
            isSwiperDraggingRef.current = true;
          }}
          onTouchEnd={() => {
            isSwiperDraggingRef.current = false;
          }}
        >
          {rankingItems.map((movie: Movie, index: number) => {
            const isActive = movie.id === activeId;
            const cardRoleProps = isActive
              ? {}
              : {
                role: "button",
                tabIndex: 0,
                onClick: () => selectRankingItem(movie.id, index),
                onKeyDown: (event: KeyboardEvent<HTMLDivElement>) =>
                  handleCardKeyDown(event, movie.id, index),
              };

            return (
              <SwiperSlide
                className={`ranking-slide ${isActive ? "expanded" : ""}`}
                key={movie.id}
                style={{ position: "relative" }}
              >
                <div
                  className={`ranking-card ${isActive ? "active" : ""}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onPointerLeave={handlePointerEnd}
                  {...cardRoleProps}
                >
                  <span className="ranking-card-poster">
                    <img
                      src={imageUrl(movie.poster_path, "w500")}
                      alt={movie.title}
                      draggable={false}
                    />
                  </span>


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
                    <span className="ranking-detail-rank">
                      {(movie as Movie & { media_type?: string }).media_type === "tv" ? "시리즈" : "영화"}
                    </span>

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
                      <Link href={`/detail/${(movie as Movie & { media_type?: string }).media_type ?? "movie"}/${movie.id}?play=1`} className="ranking-btn-play">
                        <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true" style={{ fill: "#fff" }}>
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        재생
                      </Link>
                      <Link href={`/detail/${(movie as Movie & { media_type?: string }).media_type ?? "movie"}/${movie.id}`} className="ranking-btn-info">
                        <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true" style={{ fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" }}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        상세보기
                      </Link>
                    </span>
                  </span>

                </div>
                <span className={`ranking-card-compact${isActive ? " hidden" : ""}`}>
                  <span className="ranking-card-score">{index + 1}</span>
                </span>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

    </section>
  );
}
