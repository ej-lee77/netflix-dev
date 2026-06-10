"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { KeyboardEvent, PointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import WishlistButton from "@/components/common/WishlistButton";
import ShareButton from "@/components/common/ShareButton";
import { useT } from "@/lib/i18n";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { useMovieStore } from "@/store/useMovieStore";
import type { Movie } from "@/types/movie";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "./scss/rankingSection.scss";
import SectionTitle from "../common/SectionTitle";
import ThemeRow, { type ThemeItem } from "./ThemeRow";
import { filterByExcludedGenres, useExcludedGenres } from "@/data/excludedGenres";
import { filterHidden } from "@/data/hiddenContent";
import { useMaturityFiltered } from "@/data/maturityFilter";

export interface RankingItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  overview: string;
  media_type?: "movie" | "tv";
  genre_ids?: number[];
}

const IMG_BASE = "https://image.tmdb.org/t/p/";

function imageUrl(path: string, size = "w500") {
  return `${IMG_BASE}${size}${path}`;
}

function getStars(rating: number) {
  const count = Math.round(rating / 2);
  return "★".repeat(count) + "☆".repeat(5 - count);
}

interface RankingSectionProps {
  title?: string;
  items?: RankingItem[];
  href?: string;
}

export default function RankingSection({ title, items: externalItems, href }: RankingSectionProps = {}) {
  const t = useT();
  const { koreanMovies, onFetchKoreanMovies } = useMovieStore();
  const excludedGenres = useExcludedGenres();

  const [activeId, setActiveId] = useState<number | null>(null);

  // 태블릿/모바일(<=1024px)에서는 ThemeRow와 동일한 디자인/동작으로 렌더
  const [vw, setVw] = useState(1920);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isCompact = vw <= 1024;

  const swiperRef = useRef<SwiperClass | null>(null);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const isSwiperDraggingRef = useRef(false);

  useEffect(() => {
    if (!externalItems && !koreanMovies.length) {
      onFetchKoreanMovies();
    }
  }, [externalItems, onFetchKoreanMovies, koreanMovies.length]);

  const genreFilteredRanking: RankingItem[] = useMemo(() => {
    const source = externalItems
      ? externalItems
      : koreanMovies
          .filter((movie: Movie) => movie.poster_path && movie.backdrop_path)
          .map((movie: Movie) => ({ ...movie, media_type: "movie" as const }));
    // 차단 작품 + 제외 장르 작품 숨김
    return filterHidden(filterByExcludedGenres(source, excludedGenres));
  }, [externalItems, koreanMovies, excludedGenres]);

  // 관람등급 필터 후 상위 10개
  const maturityFilteredRanking = useMaturityFiltered(
    genreFilteredRanking,
    (it) => (it.media_type ?? "movie") as "movie" | "tv",
  );
  const rankingItems: RankingItem[] = useMemo(
    () => maturityFilteredRanking.slice(0, 10),
    [maturityFilteredRanking],
  );

  useEffect(() => {
    if (!activeId && rankingItems[0]) {
      setActiveId(rankingItems[0].id);
    }
  }, [activeId, rankingItems]);

  // 태블릿/모바일: 펼침형 카드 대신 다른 행들과 동일한 ThemeRow 디자인으로 동작
  if (isCompact) {
    if (!rankingItems.length) return null;

    const themeItems: ThemeItem[] = rankingItems.map((it) => ({
      ...it,
      mediaType: (it.media_type ?? "movie") as "movie" | "tv",
      genre_ids: it.genre_ids ?? [],
    }));

    return (
      <ThemeRow
        title={title ?? t("home.top10")}
        items={themeItems}
        href={href ?? "/category"}
      />
    );
  }


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

  const handlePointerEnd = () => { };

  if (!rankingItems.length) {
    return (
      <section className="ranking-section">
        <SectionTitle title='방구석 TOP 10' subTitle='오늘 많이 보는 작품을 확인해보세요' showMore={false} />

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
        <SectionTitle title={title ?? t("home.top10")} href={href ?? "/category"} showMore={false} />
      </div>

      <div className="ranking-swiper-wrap">
        <button
          className="ranking-nav-btn ranking-nav-prev"
          aria-label="이전"
          onClick={() => {
            const currentIndex = rankingItems.findIndex((m) => m.id === activeId);
            const prevIndex = currentIndex - 1;
            if (prevIndex >= 0) selectRankingItem(rankingItems[prevIndex].id, prevIndex);
          }}
          disabled={rankingItems.findIndex((m) => m.id === activeId) <= 0}
        >
          <svg width="28" height="48" viewBox="0 0 11 20" fill="none">
            <path d="M10 1L1 10L10 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="ranking-nav-btn ranking-nav-next"
          aria-label="다음"
          onClick={() => {
            const currentIndex = rankingItems.findIndex((m) => m.id === activeId);
            const nextIndex = currentIndex + 1;
            if (nextIndex < rankingItems.length) selectRankingItem(rankingItems[nextIndex].id, nextIndex);
          }}
          disabled={rankingItems.findIndex((m) => m.id === activeId) >= rankingItems.length - 1}
        >
          <svg width="28" height="48" viewBox="0 0 11 20" fill="none">
            <path d="M1 1L10 10L1 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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
          {rankingItems.map((movie: RankingItem, index: number) => {
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
                    <Image
                      src={imageUrl(movie.poster_path, "w500")}
                      alt={movie.title}
                      width={500}
                      height={750}
                      sizes="(max-width: 1024px) 28vw, 12vw"
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
                      {movie.media_type === "tv" ? "시리즈" : "영화"}
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
                      <Link href={`/detail/${movie.media_type ?? "movie"}/${movie.id}?play=1`} className="ranking-btn-play">
                        <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true" style={{ fill: "#fff" }}>
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        {t("common.play")}
                      </Link>
                      <Link href={`/detail/${movie.media_type ?? "movie"}/${movie.id}`} className="ranking-btn-info">
                        <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true" style={{ fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" }}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        {t("common.detailMore")}
                      </Link>
                      <WishlistButton item={movie} mediaType={movie.media_type ?? "movie"} stopPropagation className="card-wish" />
                      <ShareButton mediaType={movie.media_type ?? "movie"} id={movie.id} stopPropagation className="card-wish" />
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
