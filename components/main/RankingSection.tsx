"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { KeyboardEvent, PointerEvent } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { useMovieStore } from "@/store/useMovieStore";
import { useAuthStore } from "@/store/useAuthStore";

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
  const { trendingMovies, onFetchTrending } = useMovieStore();
  const { currentProfile } = useAuthStore();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  const swiperRef = useRef<SwiperClass | null>(null);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const isSwiperDraggingRef = useRef(false);
  const isActiveHoverRef = useRef(false);

  useEffect(() => {
    if (!trendingMovies.length) {
      onFetchTrending();
    }
  }, [onFetchTrending, trendingMovies.length]);

  const rankingItems = useMemo(() => {
    const filteredMovies = trendingMovies
      .filter((movie) => movie.poster_path && movie.backdrop_path)
      .slice(0, 18);
    const profileOffset = currentProfile ? (currentProfile.id - 1) * 3 : 0;
    const personalizedMovies = [
      ...filteredMovies.slice(profileOffset),
      ...filteredMovies.slice(0, profileOffset),
    ];

    return personalizedMovies.slice(0, 10);
  }, [currentProfile, trendingMovies]);

  useEffect(() => {
    setActiveId(rankingItems[0]?.id ?? null);
  }, [currentProfile?.id, rankingItems]);

  useEffect(() => {
    if (!activeId && rankingItems[0]) {
      setActiveId(rankingItems[0].id);
    }
  }, [activeId, rankingItems]);

  useEffect(() => {
    if (rankingItems.length <= 1 || isAutoPaused) return;

    const timer = window.setInterval(() => {
      const currentIndex = rankingItems.findIndex((item) => item.id === activeId);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % rankingItems.length : 0;
      const nextItem = rankingItems[nextIndex];

      if (!nextItem) return;

      setActiveId(nextItem.id);

      window.requestAnimationFrame(() => {
        const swiper = swiperRef.current;

        if (!swiper) return;

        swiper.update();
        swiper.slideTo(Math.max(nextIndex - 1, 0), 420);
      });
    }, 3000);

    return () => window.clearInterval(timer);
  }, [activeId, isAutoPaused, rankingItems]);

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
    setIsAutoPaused(true);
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

  const handlePointerEnd = () => {
    window.setTimeout(() => {
      if (!isSwiperDraggingRef.current && !isActiveHoverRef.current) {
        setIsAutoPaused(false);
      }
    }, 0);
  };

  if (!rankingItems.length) {
    return (
      <section className="ranking-section">
        <SectionTitle title='방구석 TOP 10' subTitle={`${currentProfile?.name ?? "유저"}님 취향에 맞춘 오늘의 추천`} />

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
      <div className="inner">
        <SectionTitle title='방구석 TOP 10' subTitle={`${currentProfile?.name ?? "유저"}님 취향에 맞춘 오늘의 추천`} />
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
            setIsAutoPaused(true);
          }}
          onTouchStart={() => {
            setIsAutoPaused(true);
          }}
          onTouchMove={() => {
            isSwiperDraggingRef.current = true;
            setIsAutoPaused(true);
          }}
          onTouchEnd={() => {
            window.setTimeout(() => {
              isSwiperDraggingRef.current = false;
              setIsAutoPaused(false);
            }, 0);
          }}
          onProgress={(_, progress) => {
            setSlideProgress(progress);
          }}
          onSetTranslate={(swiper) => {
            setSlideProgress(swiper.progress);
          }}
        >
          {rankingItems.map((movie, index) => {
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
              >
                <div
                  className={`ranking-card ${isActive ? "active" : ""}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onPointerLeave={handlePointerEnd}
                  onMouseEnter={() => {
                    if (isActive) {
                      isActiveHoverRef.current = true;
                      setIsAutoPaused(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isActive) {
                      isActiveHoverRef.current = false;
                      if (!isSwiperDraggingRef.current) setIsAutoPaused(false);
                    }
                  }}
                  {...cardRoleProps}
                >
                  <span className="ranking-card-poster">
                    <img
                      src={imageUrl(movie.poster_path, "w500")}
                      alt={movie.title}
                      draggable={false}
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
                      <Link href={`/detail/movie/${movie.id}`}>상세보기</Link>
                      <Link href={`/detail/movie/${movie.id}?play=1`}>
                        재생
                      </Link>
                    </span>
                  </span>

                  <span className="ranking-card-compact">
                    <span className="ranking-card-score">{index + 1}위</span>

                    <span className="ranking-card-title">{movie.title}</span>
                  </span>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      <div className="ranking-progress inner">
        <span
          style={{
            transform: `translateX(${slideProgress * 900}%)`,
          }}
        />
      </div>
    </section>
  );
}
