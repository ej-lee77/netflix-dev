"use client";

import { useEffect, useMemo, useState } from "react";
import "./scss/hero.scss";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/";

type MediaType = "movie" | "tv";

type HeroItem = {
  id: number;
  media_type?: MediaType;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
};

type TrendingResponse = {
  results?: HeroItem[];
};

type LoadState = "loading" | "ready" | "error";

const genreMap: Record<number, string> = {
  12: "모험",
  14: "판타지",
  16: "애니메이션",
  18: "드라마",
  27: "공포",
  28: "액션",
  35: "코미디",
  36: "역사",
  53: "스릴러",
  80: "범죄",
  878: "SF",
  9648: "미스터리",
  10402: "음악",
  10749: "로맨스",
  10751: "가족",
  10752: "전쟁",
  10759: "액션&어드벤처",
  10765: "SF&판타지",
  10768: "전쟁&정치",
};

function posterUrl(path: string | null, size = "w342") {
  return path ? `${IMG_BASE}${size}${path}` : "";
}

function backdropUrl(path: string | null, size = "w1280") {
  return path ? `${IMG_BASE}${size}${path}` : "";
}

function getTitle(item: HeroItem) {
  return item.title || item.name || "Untitled";
}

function getYear(item: HeroItem) {
  return (item.release_date || item.first_air_date || "").slice(0, 4);
}

function getGenres(item: HeroItem) {
  return item.genre_ids
    ?.slice(0, 2)
    .map((id) => genreMap[id])
    .filter(Boolean)
    .join(" • ");
}

function getStars(rating: number) {
  const count = Math.round(rating / 2);
  return "★".repeat(count) + "☆".repeat(5 - count);
}

async function fetchHeroItems() {
  if (!TMDB_KEY) {
    throw new Error("TMDB API key is missing.");
  }

  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    language: "ko-KR",
  });

  const res = await fetch(
    `${TMDB_BASE}/trending/all/week?${params.toString()}`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch TMDB trending data.");
  }

  const data = (await res.json()) as TrendingResponse;

  return (
    data.results
      ?.filter(
        (item) =>
          item.overview &&
          item.backdrop_path &&
          item.poster_path &&
          (item.media_type === "movie" || item.media_type === "tv"),
      )
      .slice(0, 8) ?? []
  );
}

export default function Hero() {
  const [items, setItems] = useState<HeroItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    let ignore = false;

    async function loadHero() {
      try {
        setLoadState("loading");
        const nextItems = await fetchHeroItems();

        if (ignore) return;

        setItems(nextItems);
        setActiveIndex(0);
        setLoadState(nextItems.length ? "ready" : "error");
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setItems([]);
          setLoadState("error");
        }
      }
    }

    loadHero();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [items.length]);

  const activeItem = items[activeIndex];

  const meta = useMemo(() => {
    if (!activeItem) return null;

    return {
      genres: getGenres(activeItem),
      rating: activeItem.vote_average
        ? activeItem.vote_average.toFixed(1)
        : "0.0",
      stars: getStars(activeItem.vote_average || 0),
      year: getYear(activeItem),
    };
  }, [activeItem]);

  const handlePrev = () => {
    if (!items.length) return;
    setActiveIndex((index) => (index - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    if (!items.length) return;
    setActiveIndex((index) => (index + 1) % items.length);
  };

  if (loadState === "loading") {
    return (
      <section className="hero hero-loading" aria-label="추천 콘텐츠 로딩 중">
        <div className="hero-backdrop no-img" />
        <div className="hero-content">
          <div className="hero-skeleton hero-badge-skeleton" />
          <div className="hero-skeleton hero-title-skeleton" />
          <div className="hero-skeleton hero-meta-skeleton" />
          <div className="hero-skeleton hero-desc-skeleton" />
        </div>
      </section>
    );
  }

  if (loadState === "error" || !activeItem || !meta) {
    return (
      <section className="hero hero-empty" aria-label="추천 콘텐츠 오류">
        <div className="hero-backdrop no-img" />
        <div className="hero-content">
          <div className="hero-badge">TMDB</div>
          <h2 className="hero-logo-text">콘텐츠를 불러오지 못했습니다</h2>
          <p className="hero-desc">
            NEXT_PUBLIC_TMDB_API_KEY 값과 네트워크 연결을 확인해주세요.
          </p>
        </div>
      </section>
    );
  }

  const activeBackdrop = backdropUrl(activeItem.backdrop_path);

  return (
    <section className="hero" aria-label="추천 콘텐츠">
      <div
        className="hero-backdrop"
        style={{ backgroundImage: `url(${activeBackdrop})` }}
      />

      <div className="hero-posters" aria-label="히어로 콘텐츠 목록">
        {items.slice(0, 7).map((item, index) => {
          const title = getTitle(item);
          const image = posterUrl(item.poster_path);

          return (
            <button
              className={`hero-poster${index === activeIndex ? " active" : ""}`}
              key={`${item.media_type}-${item.id}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img src={image} alt={title} loading="lazy" />
              <span className="hero-poster-grad">{title}</span>
            </button>
          );
        })}
      </div>

      <div className="hero-nav" aria-label="히어로 슬라이드 이동">
        <button
          className="hero-nav-btn"
          onClick={handlePrev}
          type="button"
          aria-label="이전"
        >
          ←
        </button>
        <button
          className="hero-nav-btn"
          onClick={handleNext}
          type="button"
          aria-label="다음"
        >
          →
        </button>
      </div>

      <div className="hero-content">
        <div className="hero-badge">
          {activeItem.media_type === "tv" ? "N SERIES" : "N FILM"}
        </div>
        <h2 className="hero-logo-text">{getTitle(activeItem)}</h2>
        <div className="hero-meta">
          <span className="hero-rating-stars">{meta.stars}</span>
          <span className="hero-rating-val">{meta.rating}</span>
          {meta.year && (
            <>
              <span className="hero-meta-sep">|</span>
              <span>{meta.year}</span>
            </>
          )}
          {meta.genres && (
            <>
              <span className="hero-meta-sep">|</span>
              <span>{meta.genres}</span>
            </>
          )}
          <span className="hero-age-badge">15+</span>
        </div>
        <p className="hero-desc">{activeItem.overview}</p>
        <div className="hero-btns">
          <button className="btn-play" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Watch Now
          </button>
          <button className="btn-info" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            상세정보
          </button>
        </div>
      </div>

      <div className="hero-dots" aria-label="히어로 슬라이드 선택">
        {items.map((item, index) => (
          <button
            aria-label={`${index + 1}번째 콘텐츠 보기`}
            className={`hero-dot${index === activeIndex ? " active" : ""}`}
            key={`${item.media_type}-${item.id}-dot`}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
