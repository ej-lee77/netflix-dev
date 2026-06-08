"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import WishlistButton from "@/components/common/WishlistButton";
import ShareButton from "@/components/common/ShareButton";
import { useT, getTmdbLang } from "@/lib/i18n";
import { useLangStore } from "@/store/useLangStore";
import { filterByExcludedGenres, useExcludedGenres } from "@/data/excludedGenres";
import { ratingCeiling, certToLevel, genreLevel } from "@/data/maturityFilter";
import { useMovieStore } from "@/store/useMovieStore";
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
  logoUrl: string;
  videoKey: string;
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

type LogoItem = {
  file_path: string;
  iso_639_1: string | null;
};

type ImagesResponse = {
  logos?: LogoItem[];
};

type ReleaseDateEntry = {
  certification: string;
  type: number;
};

type ReleaseDateResult = {
  iso_3166_1: string;
  release_dates: ReleaseDateEntry[];
};

type ReleaseDatesResponse = {
  results?: ReleaseDateResult[];
};

type ContentRatingResult = {
  iso_3166_1: string;
  rating: string;
};

type ContentRatingsResponse = {
  results?: ContentRatingResult[];
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

const genreMapEn: Record<number, string> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  53: "Thriller",
  80: "Crime",
  878: "Science Fiction",
  9648: "Mystery",
  10402: "Music",
  10749: "Romance",
  10751: "Family",
  10752: "War",
  10759: "Action & Adventure",
  10765: "Sci-Fi & Fantasy",
  10768: "War & Politics",
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

function getGenres(item: HeroItem, lang: "ko" | "en" = "ko") {
  const map = lang === "en" ? genreMapEn : genreMap;
  return item.genre_ids
    ?.slice(0, 2)
    .map((id) => map[id])
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

  const commonParams = {
    api_key: TMDB_KEY,
    language: getTmdbLang(),
    with_original_language: "ko",
    sort_by: "popularity.desc",
    page: "1",
  };

  const movieParams = new URLSearchParams({
    ...commonParams,
    "primary_release_date.gte": "2026-01-01",
  });

  const tvParams = new URLSearchParams({
    ...commonParams,
    "first_air_date.gte": "2026-01-01",
  });

  const [movieRes, tvRes] = await Promise.all([
    fetch(`${TMDB_BASE}/discover/movie?${movieParams.toString()}`),
    fetch(`${TMDB_BASE}/discover/tv?${tvParams.toString()}`),
  ]);

  if (!movieRes.ok || !tvRes.ok) {
    throw new Error("Failed to fetch TMDB data.");
  }

  const [movieData, tvData] = await Promise.all([
    movieRes.json() as Promise<TrendingResponse>,
    tvRes.json() as Promise<TrendingResponse>,
  ]);

  const blockedIds = new Set([297640]);

  const validItem = (item: HeroItem) =>
    !blockedIds.has(item.id) && item.overview && item.backdrop_path && item.poster_path;

  const movies = (movieData.results ?? [])
    .filter(validItem)
    .slice(0, 5)
    .map((item) => ({ ...item, media_type: "movie" as MediaType, logoUrl: "" }));

  const tvs = (tvData.results ?? [])
    .filter(validItem)
    .slice(0, 5)
    .map((item) => ({ ...item, media_type: "tv" as MediaType, logoUrl: "" }));

  const combined: HeroItem[] = [];
  for (let i = 0; i < Math.max(movies.length, tvs.length); i++) {
    if (movies[i]) combined.push(movies[i]);
    if (tvs[i]) combined.push(tvs[i]);
  }

  const candidates = combined.slice(0, 8);

  const [logos, videos] = await Promise.all([
    Promise.all(candidates.map(fetchHeroLogo)),
    Promise.all(candidates.map(fetchHeroVideo)),
  ]);

  return candidates
    .map((item, i) => ({ ...item, logoUrl: logos[i], videoKey: videos[i] }))
    .filter((item) => item.logoUrl !== "" && item.videoKey !== "");
}

async function fetchHeroVideo(item: HeroItem) {
  if (!TMDB_KEY || !item.media_type) return "";
  const apiKey = TMDB_KEY;

  async function requestVideo(language: string) {
    const params = new URLSearchParams({ api_key: apiKey, language });

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

async function fetchHeroCertification(item: HeroItem): Promise<string> {
  if (!TMDB_KEY || !item.media_type) return "";

  const params = new URLSearchParams({ api_key: TMDB_KEY });

  if (item.media_type === "movie") {
    const res = await fetch(
      `${TMDB_BASE}/movie/${item.id}/release_dates?${params.toString()}`,
    );
    if (!res.ok) return "";

    const data = (await res.json()) as ReleaseDatesResponse;
    const kr = data.results?.find((r) => r.iso_3166_1 === "KR");
    const cert = kr?.release_dates?.find((d) => d.certification)?.certification ?? "";
    return cert ? `${cert}+` : "";
  } else {
    const res = await fetch(
      `${TMDB_BASE}/tv/${item.id}/content_ratings?${params.toString()}`,
    );
    if (!res.ok) return "";

    const data = (await res.json()) as ContentRatingsResponse;
    const kr = data.results?.find((r) => r.iso_3166_1 === "KR");
    const rating = kr?.rating ?? "";
    return rating ? `${rating}+` : "";
  }
}

async function fetchHeroLogo(item: HeroItem): Promise<string> {
  if (!TMDB_KEY || !item.media_type) return "";

  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    include_image_language: "ko,en,null",
  });

  const res = await fetch(
    `${TMDB_BASE}/${item.media_type}/${item.id}/images?${params.toString()}`,
  );

  if (!res.ok) return "";

  const data = (await res.json()) as ImagesResponse;
  const logos = data.logos ?? [];

  const preferred = useLangStore.getState().lang === "en" ? "en" : "ko";
  const secondary = preferred === "en" ? "ko" : "en";
  const logo =
    logos.find((l) => l.iso_639_1 === preferred) ??
    logos.find((l) => l.iso_639_1 === secondary) ??
    logos.find((l) => l.iso_639_1 === null) ??
    logos[0];

  return logo ? `${IMG_BASE}w500${logo.file_path}` : "";
}

export default function Hero() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const router = useRouter();
  const { currentProfile } = useAuthStore();
  const excludedGenres = useExcludedGenres();
  const autoplayPreview = currentProfile?.settings?.playback?.autoplayPreview ?? true;
  const [items, setItems] = useState<HeroItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCertification, setActiveCertification] = useState("");
  const [activeVideoKey, setActiveVideoKey] = useState("");
  const [currentVideoKey, setCurrentVideoKey] = useState("");
  const [previousVideoKey, setPreviousVideoKey] = useState("");
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const currentVideoKeyRef = useRef("");
  const itemsRef = useRef<HeroItem[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadHero() {
      try {
        setLoadState("loading");
        const fetched = await fetchHeroItems();

        if (ignore) return;

        // 제외 장르 작품은 히어로 후보에서 제거
        const nextItemsRaw = filterByExcludedGenres(fetched, excludedGenres);

        // 관람등급 필터: 허용 등급 초과 작품은 히어로 후보에서 제외
        let nextItems = nextItemsRaw;
        const ceiling = ratingCeiling(currentProfile?.settings?.maturityRating);
        if (ceiling < 19 && nextItems.length) {
          const fetchCert = useMovieStore.getState().onFetchCertification;
          await Promise.all(
            nextItems.map((it) => (it.media_type ? fetchCert(it.id, it.media_type) : Promise.resolve())),
          );
          if (ignore) return;
          const certs = useMovieStore.getState().certifications;
          nextItems = nextItems.filter((it) => {
            let level = certToLevel(certs[`${it.media_type}-${it.id}`]);
            if (level < 0) {
              const gl = genreLevel((it as { genre_ids?: number[] }).genre_ids);
              level = gl < 0 ? 0 : gl;
            }
            return level <= ceiling;
          });
        }

        const randomIndex = Math.floor(Math.random() * nextItems.length);
        setItems(nextItems);
        setActiveIndex(nextItems.length ? randomIndex : 0);
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
  }, [lang, excludedGenres, currentProfile?.settings?.maturityRating]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let playbackTimer: number | null = null;

    function removeCurrentVideo() {
      const failedKey = currentVideoKeyRef.current;
      if (!failedKey) return;
      const next = itemsRef.current.filter((item) => item.videoKey !== failedKey);
      setItems(next);
      setActiveIndex((prev) => Math.min(prev, Math.max(0, next.length - 1)));
    }

    function resetPlaybackTimer() {
      if (playbackTimer) window.clearTimeout(playbackTimer);
      playbackTimer = window.setTimeout(removeCurrentVideo, 8000);
    }

    function handleYouTubeMessage(event: MessageEvent) {
      if (event.origin !== "https://www.youtube.com") return;

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.event === "onError" && [100, 101, 150].includes(data.info)) {
          if (playbackTimer) window.clearTimeout(playbackTimer);
          removeCurrentVideo();
          return;
        }

        if (data.event === "onStateChange") {
          if (data.info === 1) {
            // playing — video is fine, cancel the timer
            if (playbackTimer) window.clearTimeout(playbackTimer);
            playbackTimer = null;
          } else if (data.info === -1 || data.info === 3) {
            // unstarted or buffering — (re)start the watchdog
            resetPlaybackTimer();
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    }

    window.addEventListener("message", handleYouTubeMessage);
    return () => {
      window.removeEventListener("message", handleYouTubeMessage);
      if (playbackTimer) window.clearTimeout(playbackTimer);
    };
  }, []);

  const activeItem = items[activeIndex];

  useEffect(() => {
    if (!activeItem) {
      setActiveCertification("");
      return;
    }

    let ignore = false;

    async function loadCertification() {
      const cert = await fetchHeroCertification(activeItem);
      if (!ignore) setActiveCertification(cert);
    }

    setActiveCertification("");
    loadCertification();

    return () => {
      ignore = true;
    };
  }, [activeItem]);

  useEffect(() => {
    if (!activeItem) {
      setActiveVideoKey("");
      setIsVideoVisible(false);
      return;
    }

    const videoKey = activeItem.videoKey;

    setIsVideoVisible(false);

    if (videoKey && videoKey === currentVideoKeyRef.current) {
      const timer = window.setTimeout(() => setIsVideoVisible(true), 120);
      return () => window.clearTimeout(timer);
    } else {
      setActiveVideoKey(videoKey);
    }
  }, [activeItem]);

  useEffect(() => {
    const currentKey = currentVideoKeyRef.current;

    if (!activeVideoKey) {
      if (currentKey) setPreviousVideoKey(currentKey);

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

    if (currentKey) setPreviousVideoKey(currentKey);

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
      genres: getGenres(activeItem, lang),
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
  const origin = window.location.origin;
  const getVideoSrc = (videoKey: string) =>
    `https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&loop=1&playlist=${videoKey}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&cc_load_policy=1&cc_lang_pref=ko&origin=${encodeURIComponent(origin)}`;
  const visiblePosters = [-2, -1, 0, 1, 2]
    .map((offset) => {
      const index = (activeIndex + offset + items.length) % items.length;
      return { item: items[index], index, offset };
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
      {autoplayPreview && (previousVideoKey || currentVideoKey) && (
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


      <div className="hero-content">
        <img
          className="hero-logo-img"
          src={activeItem.logoUrl}
          alt={getTitle(activeItem)}
          onError={() => {
            const next = items.filter((item) => item.id !== activeItem.id);
            setItems(next);
            setActiveIndex((prev) => Math.min(prev, Math.max(0, next.length - 1)));
          }}
        />
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
          {activeCertification && (
            <span className="hero-age-badge">{activeCertification}</span>
          )}
        </div>
        <p className="hero-desc">{activeItem.overview}</p>
        <div className="hero-btns">
          <button
            className="btn-play"
            type="button"
            onClick={() => router.push(`/detail/${activeItem.media_type}/${activeItem.id}?play=1`)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {t("common.play")}
          </button>
          <button
            className="btn-info"
            type="button"
            onClick={() => router.push(`/detail/${activeItem.media_type}/${activeItem.id}`)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            {t("common.detail")}
          </button>
          <WishlistButton item={activeItem} mediaType={activeItem.media_type} className="hero-wish" />
          <ShareButton mediaType={activeItem.media_type} id={activeItem.id} className="hero-wish" />
        </div>
      </div>

    </section>
  );
}