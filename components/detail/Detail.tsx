"use client";

import React, { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { useMovieStore } from "@/store/useMovieStore";
import { usePlayListStore } from "@/store/usePlayListStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import type { CastMember, Movie, TV, Video } from "@/types/movie";
import "./detail.module.scss";

interface DetailClientProps {
  type: "movie" | "tv";
  mediaId: number;
}

type DetailMedia = (Movie | TV) & {
  adult?: boolean;
  created_by?: { id: number; name: string }[];
  first_air_date?: string;
  genres?: { id: number; name: string }[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  production_countries?: { iso_3166_1: string; name: string }[];
  runtime?: number;
  status?: string;
  tagline?: string;
  vote_count?: number;
};

type DetailTab = "episodes" | "info" | "cast" | "director" | "review" | "related";

const REVIEW_PAGE_SIZE = 5;

interface RegisteredReview {
  id: number;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
  spoiler: boolean;
  mediaId?: number;
  mediaType?: "movie" | "tv";
  mediaTitle?: string;
  posterPath?: string;
}

const USER_REVIEWS_KEY = "netflix-user-reviews";

const loadUserReviews = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(USER_REVIEWS_KEY);
    return stored ? JSON.parse(stored) as RegisteredReview[] : [];
  } catch {
    return [];
  }
};

const saveUserReviews = (reviews: RegisteredReview[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_REVIEWS_KEY, JSON.stringify(reviews));
};

function getTitle(item?: DetailMedia) {
  if (!item) return "";
  return "name" in item ? item.name : item.title;
}

function imageUrl(path?: string | null, size = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : "";
}

function getMoodTags(genres?: { id: number; name: string }[]) {
  const moodByGenreId: Record<number, string> = {
    12: "모험적인",
    14: "몽환적인",
    16: "따뜻한",
    18: "감성적인",
    27: "무서운",
    28: "흥미진진",
    35: "유쾌한",
    36: "묵직한",
    53: "긴장감",
    80: "어두운",
    99: "지적인",
    878: "상상력",
    9648: "미스터리",
    10402: "감각적인",
    10749: "로맨틱",
    10751: "편안한",
    10752: "강렬한",
    10759: "흥미진진",
    10762: "가벼운",
    10764: "리얼한",
    10765: "상상력",
    10766: "몰입감",
    10768: "묵직한",
  };

  return Array.from(new Set((genres ?? []).map((genre) => moodByGenreId[genre.id]).filter(Boolean))).slice(0, 2);
}

const GENRE_MAP: Record<number, string> = {
  28: "액션", 12: "모험", 16: "애니메이션", 35: "코미디", 80: "범죄",
  99: "다큐", 18: "드라마", 10751: "가족", 14: "판타지", 36: "역사",
  27: "공포", 10402: "음악", 9648: "미스터리", 10749: "로맨스", 878: "SF",
  53: "스릴러", 10752: "전쟁", 37: "서부",
  10759: "액션", 10762: "어린이", 10765: "SF", 10768: "전쟁",
};

export default function DetailClient({ type, mediaId }: DetailClientProps) {
  const isTv = type === "tv";
  const searchParams = useSearchParams();
  const shouldAutoPlay = searchParams.get("play") === "1";

  const {
    tvs, tvVideos, onFetchTvs, onFetchTvVideos,
    seasons, onFetchSeasons,
    episodes, onFetchEpisodes,
    popMovies, popVideos, onFetchPopular, onFetchVideo,
    mediaDetails, onFetchMediaDetail,
    casts, onFetchCredits,
    mediaRecommended, onFetchMediaRecommended,
    movieImages, onFetchMovieImages,
    certifications, onFetchCertification,
  } = useMovieStore();

  const { onAddPlayList, onAddMyList } = usePlayListStore();
  const { onLoadWishlist, onAddWish, onRemoveWish, isWished, wishlistIds } = useWishlistStore();

  const [showPopup, setShowPopup] = useState(false);
  const [popupVideoKey, setPopupVideoKey] = useState<string | null>(null);
  const [selectSeason, setSelectSeason] = useState(1);
  const [selectEpisodeId, setSelectEpisodeId] = useState<number | null>(null);
  const [episodePage, setEpisodePage] = useState(1);
  const [activeTab, setActiveTab] = useState<DetailTab>(isTv ? "episodes" : "info");
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [ratedStar, setRatedStar] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [hoveredRelatedId, setHoveredRelatedId] = useState<number | null>(null);
  const [isAddingPlayList, setIsAddingPlayList] = useState(false);
  const [isAddingMyList, setIsAddingMyList] = useState(false);
  const [isAddingWish, setIsAddingWish] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewHasSpoiler, setReviewHasSpoiler] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [submittedReviews, setSubmittedReviews] = useState<RegisteredReview[]>([]);

  const stillsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasAutoPlayed = useRef(false);

  const onStillsMouseDown = () => { isDragging.current = true; };
  const onStillsMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !stillsRef.current) return;
    stillsRef.current.scrollLeft -= e.movementX;
  };
  const onStillsMouseUp = () => { isDragging.current = false; };

  // 찜 버튼 상태 표시를 위해 위시리스트 로드
  useEffect(() => {
    onLoadWishlist();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setActiveTab(isTv ? "episodes" : "info");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isTv]);

  useEffect(() => {
    if (isTv && tvs.length === 0) {
      onFetchTvs();
    } else if (!isTv && popMovies.length === 0) {
      onFetchPopular();
    }
  }, [isTv, tvs.length, popMovies.length, onFetchTvs, onFetchPopular]);

  useEffect(() => {
    if (!mediaId) return;
    onFetchMediaDetail(mediaId, type);
    onFetchCredits(mediaId, type);
    if (isTv) {
      onFetchTvVideos(mediaId);
    } else {
      onFetchVideo(mediaId);
    }
  }, [type, isTv, mediaId, onFetchMediaDetail, onFetchCredits, onFetchTvVideos, onFetchVideo]);

  useEffect(() => {
    if (mediaId) onFetchMediaRecommended(mediaId, type);
  }, [mediaId, type, onFetchMediaRecommended]);

  useEffect(() => {
    if (isTv && mediaId) onFetchSeasons(mediaId);
  }, [isTv, mediaId, onFetchSeasons]);

  useEffect(() => {
    if (isTv && mediaId) onFetchEpisodes(mediaId, selectSeason);
  }, [isTv, mediaId, selectSeason, onFetchEpisodes]);

  useEffect(() => {
    if (!isTv && mediaId) onFetchMovieImages(mediaId);
  }, [isTv, mediaId, onFetchMovieImages]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const reviews = loadUserReviews().filter((review) => (
        review.mediaId === mediaId && review.mediaType === type
      ));
      setSubmittedReviews(reviews);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [mediaId, type]);

  const mediaItem = (mediaDetails[`${type}-${mediaId}`] ?? (
    isTv
      ? tvs.find((item) => item.id === mediaId)
      : popMovies.find((item) => item.id === mediaId)
  )) as DetailMedia | undefined;

  const title = getTitle(mediaItem);
  const releaseDate = isTv ? mediaItem?.first_air_date : (mediaItem as Movie | undefined)?.release_date;
  const releaseYear = releaseDate?.split("-")[0] ?? "";
  const countryText = mediaItem?.production_countries?.slice(0, 2).map((c) => c.name).join(", ") ?? "";
  const seasonOrRuntimeText = isTv
    ? [
      mediaItem?.number_of_seasons ? `시즌 ${mediaItem.number_of_seasons}` : null,
      mediaItem?.number_of_episodes ? `${mediaItem.number_of_episodes}부작` : null,
    ].filter(Boolean).join(" / ")
    : mediaItem?.runtime ? `${mediaItem.runtime}분` : "";
  const moodTags = getMoodTags(mediaItem?.genres);
  const castKey = `${type}-${mediaId}`;
  const castList: CastMember[] = casts[castKey] ?? [];

  const rawCert = certifications[castKey] ?? "";
  const ageBadge = ((): "ALL" | "12+" | "15+" | "19+" => {
    if (rawCert === "12") return "12+";
    if (rawCert === "15") return "15+";
    if (rawCert === "19" || rawCert === "Restricted Screening") return "19+";
    return "ALL";
  })();
  const directorList = isTv
    ? mediaItem?.created_by ?? []
    : castList.filter((m) => m.order <= 2).slice(0, 3);
  const videos = isTv
    ? (mediaItem ? tvVideos[mediaItem.id] : undefined)
    : (mediaItem ? popVideos[mediaItem.id] : undefined);
  const trailer = videos?.find((v: Video) => v.type === "Trailer" || v.type === "Teaser");
  const selectedEpisode = isTv
    ? (episodes.find((ep) => ep.id === selectEpisodeId) ?? episodes[0] ?? null)
    : null;
  const activeEpisodeId = selectedEpisode?.id ?? null;
  const detailBackdrop =
    imageUrl(mediaItem?.backdrop_path, "original") ||
    imageUrl(selectedEpisode?.still_path, "original") ||
    imageUrl(mediaItem?.poster_path, "original");
  const posterUrl = imageUrl(mediaItem?.poster_path, "w500");
  const relatedItems = (mediaRecommended[`${type}-${mediaId}`] ?? []).slice(0, 6);
  const sampleReviews: RegisteredReview[] = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    author: ["민지", "준호", "서연", "도윤", "하린", "지우"][index % 6],
    rating: 5 - (index % 3) * 0.5,
    content: index % 2 === 0
      ? `${title || "이 작품"}은 장면의 밀도와 분위기가 좋아서 끝까지 몰입하게 만드는 힘이 있었어요.`
      : "캐릭터의 선택이 인상적이었고 후반부 전개가 꽤 강하게 남았습니다.",
    createdAt: `2026.05.${String(28 - index).padStart(2, "0")}`,
    spoiler: index % 4 === 0,
  }));
  const registeredReviews = [...submittedReviews, ...sampleReviews];
  const totalReviewPages = Math.ceil(registeredReviews.length / REVIEW_PAGE_SIZE);
  const pagedReviews = registeredReviews.slice(
    (reviewPage - 1) * REVIEW_PAGE_SIZE,
    reviewPage * REVIEW_PAGE_SIZE
  );

  const tabItems: { id: DetailTab; label: string; meta?: string }[] = [
    ...(isTv ? [{ id: "episodes" as const, label: "회차", meta: episodes.length ? `${episodes.length}` : undefined }] : []),
    { id: "info", label: "작품 정보" },
    { id: "cast", label: "출연진", meta: castList.length ? `${castList.length}` : undefined },
    { id: "director", label: "감독" },
    { id: "review", label: "리뷰", meta: isTv ? "12.8k" : "4.2k" },
    { id: "related", label: "관련 콘텐츠" },
  ];

  const handleSeasonSelect = (seasonNumber: number) => {
    setSelectSeason(seasonNumber);
    setSelectEpisodeId(null);
    setEpisodePage(1);
  };

  const openVideo = async (key?: string | null) => {
    if (!mediaItem) return;
    if (isTv) await onFetchTvVideos(mediaId);
    else await onFetchVideo(mediaId);
    setPopupVideoKey(key ?? trailer?.key ?? null);
    setShowPopup(true);
  };

  const handlePlay = async () => {
    if (!mediaItem || isAddingPlayList) return;

    setIsAddingPlayList(true);
    try {
      await onAddPlayList(mediaItem);
      await openVideo();
    } finally {
      setIsAddingPlayList(false);
    }
  };

  const handleMyList = async () => {
    if (!mediaItem || isAddingMyList) return;

    setIsAddingMyList(true);
    try {
      await onAddMyList(mediaItem);
    } finally {
      setIsAddingMyList(false);
    }
  };

  // 위시리스트 찜 추가/해제 토글
  const handleWish = async () => {
    if (!mediaItem || isAddingWish) return;

    setIsAddingWish(true);
    try {
      if (isWished(mediaItem.id)) {
        await onRemoveWish(mediaItem.id);
      } else {
        await onAddWish(mediaItem);
      }
    } finally {
      setIsAddingWish(false);
    }
  };

  const handleSubmitReview = () => {
    const content = reviewText.trim();
    if (!content) return;

    const newReview: RegisteredReview = {
      id: Date.now(),
      author: "나",
      rating: ratedStar || 5,
      content,
      createdAt: new Date().toLocaleDateString("ko-KR"),
      spoiler: reviewHasSpoiler,
      mediaId,
      mediaType: type,
      mediaTitle: title,
      posterPath: mediaItem?.poster_path,
    };

    setSubmittedReviews((prev) => [newReview, ...prev]);
    saveUserReviews([newReview, ...loadUserReviews()]);
    setReviewText("");
    setReviewHasSpoiler(false);
    setRatedStar(0);
    setHoverStar(0);
    setReviewPage(1);
  };

  useEffect(() => {
    if (!shouldAutoPlay || hasAutoPlayed.current || !mediaItem || !videos) return;

    hasAutoPlayed.current = true;
    handlePlay();
  }, [shouldAutoPlay, mediaItem, videos]);

  // ─── Render sections ────────────────────────────────────────────────────────

  const renderEpisodesTab = () => {
    const PAGE_SIZE = 6;
    const totalPages = Math.ceil(episodes.length / PAGE_SIZE);
    const paged = episodes.slice((episodePage - 1) * PAGE_SIZE, episodePage * PAGE_SIZE);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "48px 40px 0" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {seasons.map((season) => {
              const isSelected = selectSeason === season.season_number;
              return (
                <button
                  key={season.id}
                  onClick={() => handleSeasonSelect(season.season_number)}
                  style={{
                    background: isSelected ? "#e50914" : "transparent",
                    border: `1px solid ${isSelected ? "#e50914" : "#3a3a48"}`,
                    padding: "8px 18px",
                    borderRadius: 100,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: isSelected ? 700 : 400,
                    color: isSelected ? "#fff" : "#888",
                    whiteSpace: "nowrap",
                  }}
                >
                  {season.name}
                </button>
              );
            })}
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer" }}>
            <span style={{ fontSize: 14 }}>↕</span> 오래된순
          </button>
        </div>

        {/* Episode grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {paged.map((ep, idx) => {
            const isActive = ep.id === activeEpisodeId;
            const stillUrl = imageUrl(ep.still_path, "w500") || imageUrl(mediaItem?.backdrop_path, "w500");
            const isLastRow = idx >= paged.length - (paged.length % 2 === 0 ? 2 : 1);
            const isLeft = idx % 2 === 0;
            const meta = [ep.runtime ? `${ep.runtime}분` : null, ep.air_date ?? null].filter(Boolean).join(" · ");

            return (
              <div
                key={ep.id}
                onClick={() => setSelectEpisodeId(ep.id)}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "20px 0",
                  borderBottom: isLastRow ? "none" : "1px solid rgba(255,255,255,0.07)",
                  paddingLeft: isLeft ? 0 : 20,
                  paddingRight: isLeft ? 20 : 0,
                  cursor: "pointer",
                  background: "transparent",
                }}
              >
                <div style={{ position: "relative", flexShrink: 0, width: 180, height: 110, borderRadius: 6, overflow: "hidden", background: "#2a2a35" }}>
                  {stillUrl && (
                    <img src={stillUrl} alt={ep.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.25)",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.15s",
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>▶</div>
                  </div>
                  {isActive && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, width: "65%", background: "#e50914" }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, marginLeft: 16 }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.4 }}>
                    {ep.episode_number}. {ep.name}
                  </p>
                  {meta && <p style={{ fontSize: 14, color: "#666", margin: 0 }}>{meta}</p>}
                  <p style={{
                    fontSize: 14, color: "#999", margin: 0, lineHeight: 1.6,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitBoxOrient: "vertical", WebkitLineClamp: 3,
                  } as CSSProperties}>
                    {ep.overview}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 8 }}>
            <button
              onClick={() => setEpisodePage((p) => Math.max(1, p - 1))}
              disabled={episodePage === 1}
              style={{ background: "none", border: "1px solid #3a3a48", color: episodePage === 1 ? "#444" : "#888", width: 34, height: 34, borderRadius: 4, cursor: episodePage === 1 ? "default" : "pointer", fontSize: 14 }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setEpisodePage(page)}
                style={{
                  width: 34, height: 34, borderRadius: 4, fontSize: 14, cursor: "pointer",
                  background: page === episodePage ? "#e50914" : "none",
                  border: `1px solid ${page === episodePage ? "#e50914" : "#3a3a48"}`,
                  color: page === episodePage ? "#fff" : "#888",
                  fontWeight: page === episodePage ? 700 : 400,
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setEpisodePage((p) => Math.min(totalPages, p + 1))}
              disabled={episodePage === totalPages}
              style={{ background: "none", border: "1px solid #3a3a48", color: episodePage === totalPages ? "#444" : "#888", width: 34, height: 34, borderRadius: 4, cursor: episodePage === totalPages ? "default" : "pointer", fontSize: 14 }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSynopsis = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "56px 40px 0" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
        {isTv ? "시리즈 줄거리" : "영화 줄거리"}
      </h2>
      <div style={{ position: "relative" }}>
        <p style={{
          fontSize: 16, color: "#ccc", lineHeight: 1.72, margin: 0,
          overflow: "hidden",
          whiteSpace: synopsisExpanded ? "normal" : "nowrap",
          textOverflow: synopsisExpanded ? "clip" : "ellipsis",
          maxWidth: synopsisExpanded ? "100%" : "50%",
        }}>
          {mediaItem?.overview}
        </p>
        {!synopsisExpanded && (
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: "50%",
            background: "linear-gradient(to right, transparent 0%, #141414 100%)",
            pointerEvents: "none",
          }} />
        )}
      </div>
      {mediaItem?.overview && (
        <button
          onClick={() => setSynopsisExpanded(!synopsisExpanded)}
          style={{ fontSize: 14, color: "#e50914", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "fit-content" }}
        >
          {synopsisExpanded ? "접기 ▴" : "더보기 ▾"}
        </button>
      )}
    </div>
  );

  const renderRating = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "56px 40px 0" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>시리즈 평가</h2>
      <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid #2a2a35", padding: "20px 21px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 16, color: "#888" }}>별점을 매겨주세요</span>
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHoverStar(s)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => setRatedStar(s)}
                style={{
                  fontSize: 24,
                  color: s <= (hoverStar || ratedStar) ? "#e50914" : "#333",
                  background: "none", border: "none", cursor: "pointer",
                  transition: "color 0.1s", lineHeight: 1,
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button style={{ borderRadius: 100, padding: "8px 14px", background: "transparent", border: "1px solid #3a3a48", color: "#888", fontSize: 12, cursor: "pointer" }}>
            ＋ 플레이리스트
          </button>
          <button style={{ borderRadius: 100, padding: "8px 14px", background: "transparent", border: "1px solid #3a3a48", color: "#888", fontSize: 12, cursor: "pointer" }}>
            🔔 신규 회차 알림
          </button>
        </div>
      </div>
    </div>
  );
  void renderRating;

  const renderReviewTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "56px 40px 0" }}>
      <section style={{ border: "1px solid #2a2a35", borderRadius: 8, background: "rgba(255,255,255,0.03)", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>내 리뷰 작성</h2>
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className="detail-icon-hover"
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => setRatedStar(star)}
                style={{
                  fontSize: 24,
                  color: star <= (hoverStar || ratedStar) ? "#e50914" : "#3a3a48",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          placeholder="이 작품에 대한 감상을 남겨보세요."
          style={{
            width: "100%",
            minHeight: 130,
            resize: "vertical",
            border: "1px solid #3a3a48",
            borderRadius: 6,
            background: "#111",
            color: "#fff",
            padding: 16,
            fontSize: 14,
            lineHeight: 1.7,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            className="detail-chip-hover"
            onClick={() => setReviewHasSpoiler((value) => !value)}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 6,
              border: `1px solid ${reviewHasSpoiler ? "#e50914" : "#3a3a48"}`,
              background: reviewHasSpoiler ? "rgba(229,9,20,0.12)" : "transparent",
              color: reviewHasSpoiler ? "#e50914" : "#aaa",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {reviewHasSpoiler ? "스포일러 포함" : "스포일러 없음"}
          </button>
          <button
            type="button"
            className="detail-primary-hover"
            onClick={handleSubmitReview}
            disabled={!reviewText.trim()}
            style={{
              height: 40,
              padding: "0 18px",
              borderRadius: 6,
              border: "none",
              background: "#e50914",
              color: "#fff",
              cursor: reviewText.trim() ? "pointer" : "default",
              opacity: reviewText.trim() ? 1 : 0.45,
              fontWeight: 800,
            }}
          >
            리뷰 등록
          </button>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>등록된 리뷰</h2>
          <span style={{ color: "#888", fontSize: 13 }}>{registeredReviews.length}개</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pagedReviews.map((review) => (
            <article
              key={review.id}
              style={{
                border: "1px solid #2a2a35",
                borderRadius: 8,
                background: "rgba(255,255,255,0.025)",
                padding: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <div>
                  <strong style={{ color: "#fff", fontSize: 15 }}>{review.author}</strong>
                  <span style={{ color: "#e50914", marginLeft: 10, fontSize: 13 }}>★★★★★</span>
                  <span style={{ color: "#aaa", marginLeft: 8, fontSize: 12 }}>{review.rating.toFixed(1)} / 5.0</span>
                  {review.spoiler && (
                    <span style={{ marginLeft: 8, padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(229,9,20,0.45)", color: "#e50914", fontSize: 11 }}>
                      스포일러
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="detail-outline-hover"
                  style={{ border: "1px solid #3a3a48", borderRadius: 4, background: "transparent", color: "#888", height: 30, padding: "0 10px", cursor: "pointer", fontSize: 12 }}
                >
                  신고
                </button>
              </div>
              <p style={{ margin: 0, color: "#cfcfcf", lineHeight: 1.7, fontSize: 14 }}>{review.content}</p>
              <time style={{ display: "block", marginTop: 12, color: "#666", fontSize: 12 }}>{review.createdAt}</time>
            </article>
          ))}
        </div>

        {totalReviewPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 8 }}>
            <button
              type="button"
              className="detail-page-hover"
              onClick={() => setReviewPage((page) => Math.max(1, page - 1))}
              disabled={reviewPage === 1}
              style={{ background: "none", border: "1px solid #3a3a48", color: reviewPage === 1 ? "#444" : "#888", width: 34, height: 34, borderRadius: 4, cursor: reviewPage === 1 ? "default" : "pointer", fontSize: 14 }}
            >
              ‹
            </button>
            {Array.from({ length: totalReviewPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                key={page}
                className="detail-page-hover"
                onClick={() => setReviewPage(page)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 4,
                  fontSize: 14,
                  cursor: "pointer",
                  background: page === reviewPage ? "#e50914" : "none",
                  border: `1px solid ${page === reviewPage ? "#e50914" : "#3a3a48"}`,
                  color: page === reviewPage ? "#fff" : "#888",
                  fontWeight: page === reviewPage ? 700 : 400,
                }}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="detail-page-hover"
              onClick={() => setReviewPage((page) => Math.min(totalReviewPages, page + 1))}
              disabled={reviewPage === totalReviewPages}
              style={{ background: "none", border: "1px solid #3a3a48", color: reviewPage === totalReviewPages ? "#444" : "#888", width: 34, height: 34, borderRadius: 4, cursor: reviewPage === totalReviewPages ? "default" : "pointer", fontSize: 14 }}
            >
              ›
            </button>
          </div>
        )}
      </section>
    </div>
  );

  const renderRelated = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "56px 40px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>함께 보면 좋은 작품</h2>
        <span style={{ fontSize: 12, color: "#888", cursor: "pointer" }}>더보기 →</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        {relatedItems.map((item) => {
          const isHovered = hoveredRelatedId === item.id;
          return (
            <a
              key={`${item.media_type}-${item.id}`}
              href={`/detail/${item.media_type}/${item.id}`}
              onMouseEnter={() => setHoveredRelatedId(item.id)}
              onMouseLeave={() => setHoveredRelatedId(null)}
              style={{
                position: "relative", display: "block", borderRadius: 6, overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.05)", aspectRatio: "2/3",
                background: "#1a1a22",
                transform: isHovered ? "scale(1.04)" : "scale(1)",
                transition: "transform 0.2s",
              }}
            >
              {item.poster_path && (
                <img
                  src={imageUrl(item.poster_path)}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isHovered ? 0.4 : 0.8, transition: "opacity 0.2s" }}
                />
              )}
              <span style={{
                position: "absolute", top: 8, right: 8,
                fontSize: 14, padding: "3px 9px", borderRadius: 3,
                background: "rgba(0,0,0,0.7)", color: "#ccc",
              }}>
                {item.media_type === "tv" ? "시리즈" : "영화"}
              </span>
              {isHovered && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", justifyContent: "flex-end",
                  padding: "20px 20px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
                  gap: 8,
                }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
                    {item.title}
                  </p>
                  {/* 별점 · 연도 · 장르 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    {item.vote_average > 0 && (
                      <>
                        <span style={{ fontSize: 12, color: "#e50914" }}>★</span>
                        <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{item.vote_average.toFixed(1)}</span>
                        <span style={{ fontSize: 12, color: "#555" }}>|</span>
                      </>
                    )}
                    {item.release_date && (
                      <>
                        <span style={{ fontSize: 12, color: "#bbb" }}>{item.release_date.slice(0, 4)}</span>
                        {(item.genre_ids ?? []).length > 0 && <span style={{ fontSize: 14, color: "#555" }}>|</span>}
                      </>
                    )}
                    {(item.genre_ids ?? []).length > 0 && (
                      <span style={{ fontSize: 12, color: "#bbb" }}>
                        {(item.genre_ids ?? []).slice(0, 2).map((id: number) => GENRE_MAP[id]).filter(Boolean).join(" • ")}
                      </span>
                    )}
                  </div>
                  {/* 줄거리 */}
                  {item.overview && (
                    <p style={{
                      fontSize: 12, color: "#aaa", margin: 0, lineHeight: 1.55,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitBoxOrient: "vertical", WebkitLineClamp: 2,
                    } as CSSProperties}>
                      {item.overview}
                    </p>
                  )}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );

  const renderCast = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "56px 40px 0" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>출연진</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {castList.slice(0, 12).map((member, idx) => {
          const isLastRow = idx >= castList.slice(0, 12).length - (castList.slice(0, 12).length % 4 || 4);
          const isRightCol = (idx + 1) % 4 !== 0;
          return (
            <div
              key={member.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 0",
                borderBottom: isLastRow ? "none" : "1px solid rgba(255,255,255,0.07)",
                borderRight: isRightCol ? "1px solid rgba(255,255,255,0.07)" : "none",
                paddingLeft: idx % 4 === 0 ? 0 : 20,
                paddingRight: (idx + 1) % 4 === 0 ? 0 : 20,
              }}
            >
              <div style={{
                flexShrink: 0,
                width: 52, height: 52,
                borderRadius: 8,
                overflow: "hidden",
                background: "#2a2a35",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                {member.profile_path && (
                  <img src={imageUrl(member.profile_path, "w185")} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {member.name}
                </p>
                <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  출연 | {member.character}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStills = () => {
    const rawImages = movieImages[mediaId] ?? [];
    const stills = rawImages.length > 0
      ? rawImages.slice(0, 8).map((img) => imageUrl(img.file_path, "w780"))
      : [
        mediaItem?.backdrop_path ? imageUrl(mediaItem.backdrop_path, "w780") : null,
        mediaItem?.poster_path ? imageUrl(mediaItem.poster_path, "w780") : null,
      ].filter(Boolean) as string[];

    if (stills.length === 0) return null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "56px 40px 0" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>스틸컷</h2>
        <div
          ref={stillsRef}
          className="scrollbar-hide"
          style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, cursor: "grab", userSelect: "none" }}
          onMouseDown={onStillsMouseDown}
          onMouseMove={onStillsMouseMove}
          onMouseUp={onStillsMouseUp}
          onMouseLeave={onStillsMouseUp}
        >
          {stills.map((src, i) => (
            <div
              key={i}
              onClick={() => {
                if (!isDragging.current) setLightboxSrc(src);
              }}
              style={{
                flexShrink: 0,
                width: 320,
                height: 180,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#1a1a22",
                cursor: "pointer",
              }}
            >
              <img src={src} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
            </div>
          ))}
        </div>
      </div>
    );
  };


  const renderDirector = () => (
    <div style={{ padding: "56px 40px 0" }}>
      <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", padding: 28 }}>
        <p style={{ marginBottom: 20, fontSize: 12, fontWeight: 600, color: "#e50914" }}>Creative</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {directorList.length > 0
            ? directorList.map((person) => (
              <span key={person.id} style={{ borderRadius: 100, border: "1px solid rgba(255,255,255,0.15)", padding: "8px 20px", color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                {person.name}
              </span>
            ))
            : <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>등록된 감독 정보가 없습니다.</p>}
        </div>
      </div>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: "#141414", minHeight: "100vh", marginTop: -56 }}>

      {/* Hero + Info Section (shared background) */}
      <div style={{ position: "relative" }}>
        {detailBackdrop && (
          <img
            src={detailBackdrop}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", opacity: 0.45 }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(20,20,20,0.7) 0%, rgba(20,20,20,0.4) 40%, transparent 75%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #141414 0%, rgba(20,20,20,0.2) 30%, transparent 60%)" }} />

        {/* Hero spacer */}
        <div style={{ height: 600 }} />

        {/* Info Section */}
        <div style={{ position: "relative", display: "flex", gap: 24, padding: "0 40px", zIndex: 10, paddingBottom: 40 }}>
          {/* Poster */}
          <div style={{
            flexShrink: 0, width: 180, height: 260, borderRadius: 8,
            overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)", background: "#2a2a35",
          }}>
            {posterUrl && <img src={posterUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>

          {/* Metadata */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10, minWidth: 0, paddingBottom: 8 }}>
            <div style={{ display: "none" }}>
              <span style={{ background: "rgba(255, 255, 255, 0.1)", padding: "3px 8px", borderRadius: 4, fontSize: 12, fontWeight: 500, color: "rgba(255, 255, 255, 0.5)" }}>
                {isTv ? "시리즈" : "영화"}
                {mediaItem?.number_of_seasons ? ` · 시즌 ${mediaItem.number_of_seasons} 진행중` : ""}
              </span>
            </div>

            <h1 style={{ fontWeight: 900, fontSize: 40, color: "#fff", lineHeight: 1.15, letterSpacing: -0.8, margin: 0 }}>
              {title}
            </h1>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {releaseYear && <span style={{ fontSize: 14, color: "#888" }}>{releaseYear}</span>}
                {seasonOrRuntimeText && (
                  <>
                    {releaseYear && <span style={{ color: "#444" }}>·</span>}
                    <span style={{ fontSize: 14, color: "#888" }}>{seasonOrRuntimeText}</span>
                  </>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {mediaItem?.genres?.slice(0, 3).map((g) => (
                  <span key={g.id} style={{ padding: "2px 10px", borderRadius: 100, border: "1px solid #555", fontSize: 11, color: "#999" }}>
                    {g.name}
                  </span>
                ))}
                {moodTags.map((mood) => (
                  <span key={mood} style={{ padding: "2px 10px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", fontSize: 11, color: "#bbb" }}>
                    {mood}
                  </span>
                ))}
                {countryText && <span style={{ fontSize: 14, color: "#888" }}>{countryText}</span>}
              </div>
            </div>

            <div style={{ display: "none", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {releaseYear && <span style={{ fontSize: 14, color: "#888" }}>{releaseYear}</span>}
              {isTv && mediaItem?.number_of_seasons && (
                <>
                  <span style={{ color: "#444" }}>·</span>
                  <span style={{ fontSize: 14, color: "#888" }}>
                    시즌 {mediaItem.number_of_seasons}
                  </span>
                </>
              )}
              {!isTv && mediaItem?.runtime && (
                <>
                  <span style={{ color: "#444" }}>·</span>
                  <span style={{ fontSize: 14, color: "#888" }}>{mediaItem.runtime}분</span>
                </>
              )}
              {mediaItem?.genres && mediaItem.genres.length > 0 && (
                <>
                  {/* <span style={{ color: "#444" }}>·</span> */}
                  {mediaItem.genres.slice(0, 3).map((g) => (
                    <span key={g.id} style={{ padding: "2px 10px", borderRadius: 100, border: "1px solid #555", fontSize: 11, color: "#999" }}>
                      {g.name}
                    </span>
                  ))}
                </>
              )}
              {/* {countryText && (
                <>
                  <span style={{ color: "#444" }}>·</span>
                  <span style={{ fontSize: 14, color: "#888" }}>{countryText}</span>
                </>
              )} */}
            </div>

            {/* Score */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#e50914", fontSize: 16, letterSpacing: -7 }}>★</span>
              <span style={{ fontWeight: 500, fontSize: 16, color: "#fff" }}>
                {mediaItem?.vote_average?.toFixed(1) ?? "-"}
              </span>
              {mediaItem?.vote_count && (
                <span style={{ fontSize: 14, color: "#888" }}>{mediaItem.vote_count.toLocaleString()}명 평가</span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button
                className="detail-primary-hover"
                onClick={handlePlay}
                disabled={isAddingPlayList}
                style={{ background: "#e50914", color: "#fff", height: 46, padding: "0 22px", fontSize: 16, fontWeight: 700, border: "none", borderRadius: 4, cursor: isAddingPlayList ? "default" : "pointer", opacity: isAddingPlayList ? 0.7 : 1 }}
              >
                {isAddingPlayList ? "추가 중..." : `▶ ${isTv ? "이어보기" : "재생하기"}`}
              </button>
              <button
                className="detail-secondary-hover"
                onClick={handleMyList}
                disabled={isAddingMyList}
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", height: 46, padding: "0 18px", fontSize: 16, fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)", borderRadius: 4, cursor: isAddingMyList ? "default" : "pointer", opacity: isAddingMyList ? 0.7 : 1 }}
              >
                {isAddingMyList ? "담는 중..." : "＋ 내 리스트"}
              </button>
              <button
                className="detail-circle-hover"
                onClick={handleWish}
                disabled={isAddingWish}
                aria-pressed={mediaItem ? wishlistIds.includes(String(mediaItem.id)) : false}
                aria-label="위시리스트에 추가"
                style={{
                  background: mediaItem && wishlistIds.includes(String(mediaItem.id)) ? "#e50914" : "rgba(229,9,20,0.1)",
                  border: "1px solid #e50914",
                  color: mediaItem && wishlistIds.includes(String(mediaItem.id)) ? "#fff" : "#e50914",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  cursor: isAddingWish ? "default" : "pointer",
                  opacity: isAddingWish ? 0.6 : 1,
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {mediaItem && wishlistIds.includes(String(mediaItem.id)) ? "♥" : "♡"}
              </button>
              <button className="detail-circle-hover" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)", color: "#888", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                🔔
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TabNav */}
      <div style={{ display: "flex", alignItems: "flex-end", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "0 40px", marginTop: 24 }}>
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              height: 48,
              padding: "0 14px 0 4px",
              marginRight: 8,
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #e50914" : "2px solid transparent",
              marginBottom: -1,
              color: activeTab === tab.id ? "#fff" : "#888",
              fontWeight: activeTab === tab.id ? 700 : 400,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            {tab.label}
            {tab.meta && <span style={{ fontSize: 10, color: "#555", marginLeft: 2 }}>{tab.meta}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ paddingBottom: 80 }}>
        {activeTab === "episodes" && isTv && renderEpisodesTab()}
        {activeTab === "info" && !isTv && renderStills()}
        {activeTab === "info" && renderSynopsis()}
        {activeTab === "info" && renderRelated()}
        {activeTab === "info" && renderCast()}
        {activeTab === "cast" && renderCast()}
        {activeTab === "director" && renderDirector()}
        {activeTab === "review" && renderReviewTab()}
        {activeTab === "related" && renderRelated()}
      </div>

      {/* Stills lightbox */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <img
            src={lightboxSrc}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, objectFit: "contain" }}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 14 }}
          >
            닫기
          </button>
        </div>
      )}

      {/* Video popup */}
      {showPopup && popupVideoKey && (
        <div style={{ position: "fixed", background: "#000", zIndex: 10000, width: "100%", height: "100%", top: 0, left: 0 }}>
          <button
            style={{ position: "absolute", right: 20, top: 20, background: "rgba(255,255,255,0.1)", padding: "8px 16px", color: "#fff", border: "none", cursor: "pointer", zIndex: 50 }}
            onClick={() => setShowPopup(false)}
          >
            닫기
          </button>
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
            <iframe
              style={{ height: "90vh", width: "100%" }}
              src={`https://www.youtube.com/embed/${popupVideoKey}?autoplay=1&mute=1`}
              title="Trailer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
