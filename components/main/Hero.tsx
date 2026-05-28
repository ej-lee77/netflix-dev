"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type VideoItem = {
  key: string;
  site: string;
  type: string;
  official?: boolean;
};

type VideosResponse = {
  results?: VideoItem[];
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

async function fetchHeroVideo(item: HeroItem) {
  if (!TMDB_KEY || !item.media_type) return "";
  const apiKey = TMDB_KEY;

  async function requestVideo(language: string) {
    const params = new URLSearchParams({
      api_key: apiKey,
      language,
    });

    const res = await fetch(
      `${TMDB_BASE}/${item.media_type}/${item.id}/videos?${params.toString()}`,
    );

    if (!res.ok) return "";

    const data = (await res.json()) as VideosResponse;
    const video = data.results?.find(
      (result) =>
        result.site === "YouTube" &&
        (result.type === "Trailer" || result.type === "Teaser"),
    );

    return video?.key ?? "";
  }

  return (await requestVideo("ko-KR")) || (await requestVideo("en-US"));
}

export default function Hero() {
  const [items, setItems] = useState<HeroItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeVideoKey, setActiveVideoKey] = useState("");
  const [currentVideoKey, setCurrentVideoKey] = useState("");
  const [previousVideoKey, setPreviousVideoKey] = useState("");
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const currentVideoKeyRef = useRef("");

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

  const activeItem = items[activeIndex];

  useEffect(() => {
    if (!activeItem) {
      setActiveVideoKey("");
      setIsVideoVisible(false);
      return;
    }

    let ignore = false;

    async function loadVideo() {
      const videoKey = await fetchHeroVideo(activeItem);

      if (!ignore) {
        if (videoKey && videoKey === currentVideoKeyRef.current) {
          window.setTimeout(() => {
            if (!ignore) {
              setIsVideoVisible(true);
            }
          }, 120);
        } else {
          setActiveVideoKey(videoKey);
        }
      }
    }

    setIsVideoVisible(false);
    loadVideo();

    return () => {
      ignore = true;
    };
  }, [activeItem]);

  useEffect(() => {
    const currentKey = currentVideoKeyRef.current;

    if (!activeVideoKey) {
      if (currentKey) {
        setPreviousVideoKey(currentKey);
      }

      currentVideoKeyRef.current = "";
      setCurrentVideoKey("");
      setIsVideoVisible(false);

      const cleanupTimer = window.setTimeout(() => {
        setPreviousVideoKey("");
      }, 900);

      return () => window.clearTimeout(cleanupTimer);
    }

    if (currentKey === activeVideoKey) {
      setIsVideoVisible(true);
      return;
    }

    if (currentKey) {
      setPreviousVideoKey(currentKey);
    }

    currentVideoKeyRef.current = activeVideoKey;
    setCurrentVideoKey(activeVideoKey);
    setIsVideoVisible(false);

    const timer = window.setTimeout(() => {
      setIsVideoVisible(true);
    }, 1000);

    const cleanupTimer = window.setTimeout(() => {
      setPreviousVideoKey("");
    }, 4500);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(cleanupTimer);
    };
  }, [activeVideoKey]);

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

  const selectHeroIndex = (index: number) => {
    setActiveIndex(index);
  };

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
  const getVideoSrc = (videoKey: string) =>
    `https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&loop=1&playlist=${videoKey}&playsinline=1&rel=0&modestbranding=1`;
  const visiblePosters = [-2, -1, 0, 1, 2]
    .map((offset) => {
      const index = (activeIndex + offset + items.length) % items.length;

      return {
        item: items[index],
        index,
        offset,
      };
    })
    .filter(
      (poster, position, posters) =>
        posters.findIndex(
          (currentPoster) => currentPoster.index === poster.index,
        ) === position,
    );

  return (
    <section className="hero" aria-label="추천 콘텐츠">
      <div
        className={`hero-backdrop${previousVideoKey || currentVideoKey ? "" : " visible"}`}
        style={{ backgroundImage: `url(${activeBackdrop})` }}
      />
      <div
        className={`hero-video-poster${isVideoVisible ? "" : " visible"}`}
        style={{ backgroundImage: `url(${activeBackdrop})` }}
      />
      {(previousVideoKey || currentVideoKey) && (
        <>
          {previousVideoKey && (
            <iframe
              className="hero-video previous"
              src={getVideoSrc(previousVideoKey)}
              title={`${getTitle(activeItem)} previous trailer`}
              allow="autoplay; encrypted-media; picture-in-picture"
              tabIndex={-1}
            />
          )}
          {currentVideoKey && (
            <iframe
              className={`hero-video${isVideoVisible ? " visible" : ""}`}
              src={getVideoSrc(currentVideoKey)}
              title={`${getTitle(activeItem)} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture"
              tabIndex={-1}
            />
          )}
          <div className="hero-video-shield" aria-hidden="true" />
        </>
      )}

      <div className="hero-posters" aria-label="히어로 콘텐츠 목록">
        {visiblePosters.map(({ item, index, offset }) => {
          const title = getTitle(item);
          const image = posterUrl(item.poster_path);
          const offsetClass =
            offset === 0
              ? "active"
              : offset < 0
                ? `before-${Math.abs(offset)}`
                : `after-${offset}`;

          return (
            <button
              className={`hero-poster ${offsetClass}`}
              key={`${item.media_type}-${item.id}`}
              onClick={() => selectHeroIndex(index)}
              type="button"
            >
              <img src={image} alt={title} loading="lazy" />
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
            재생하기
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
            onClick={() => selectHeroIndex(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
