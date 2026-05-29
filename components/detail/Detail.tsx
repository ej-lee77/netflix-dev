"use client";

import React, { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { useMovieStore } from "@/store/useMovieStore";
import { usePlayListStore } from "@/store/usePlayListStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import type { CastMember, Movie, RecommendedItem, TV, Video } from "@/types/movie";
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
const REPORT_REASONS = ["내용이 부적절해요", "스포일러가 포함되어 있어요", "욕설 또는 혐오 표현이에요", "도배성 리뷰예요", "기타"];

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

function getKoreanCountryName(country: { iso_3166_1: string; name: string }) {
  const countryNameByCode: Record<string, string> = {
    AR: "아르헨티나",
    AU: "호주",
    BE: "벨기에",
    BR: "브라질",
    CA: "캐나다",
    CN: "중국",
    DE: "독일",
    DK: "덴마크",
    ES: "스페인",
    FI: "핀란드",
    FR: "프랑스",
    GB: "영국",
    HK: "홍콩",
    IE: "아일랜드",
    IN: "인도",
    IT: "이탈리아",
    JP: "일본",
    KR: "한국",
    MX: "멕시코",
    NL: "네덜란드",
    NO: "노르웨이",
    SE: "스웨덴",
    TH: "태국",
    TR: "튀르키예",
    TW: "대만",
    US: "미국",
  };

  return countryNameByCode[country.iso_3166_1] ?? country.name;
}

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
    recommended, onFetchRecommended,
    movieImages, onFetchMovieImages,
    certifications, onFetchCertification,
  } = useMovieStore();

  const { myList, onAddPlayList, onAddMyList, onRemoveMyList, onLoadMyList } = usePlayListStore();
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
  const [reportedReviewIds, setReportedReviewIds] = useState<number[]>([]);
  const [visibleSpoilerReviewIds, setVisibleSpoilerReviewIds] = useState<number[]>([]);
  const [likedReviewIds, setLikedReviewIds] = useState<number[]>([]);
  const [reportTargetReviewId, setReportTargetReviewId] = useState<number | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState("");
  const [submittedReviews, setSubmittedReviews] = useState<RegisteredReview[]>([]);
  const [canExpandSynopsis, setCanExpandSynopsis] = useState(false);

  const stillsRef = useRef<HTMLDivElement>(null);
  const synopsisRef = useRef<HTMLParagraphElement>(null);
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
    onLoadMyList();
  }, [onLoadMyList, onLoadWishlist]);

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
    onFetchCertification(mediaId, type);
    if (isTv) {
      onFetchTvVideos(mediaId);
    } else {
      onFetchVideo(mediaId);
    }
  }, [type, isTv, mediaId, onFetchMediaDetail, onFetchCredits, onFetchCertification, onFetchTvVideos, onFetchVideo]);

  useEffect(() => {
    if (recommended.length === 0) onFetchRecommended();
  }, [recommended.length, onFetchRecommended]);

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
  const countryText = mediaItem?.production_countries?.slice(0, 2).map(getKoreanCountryName).join(", ") ?? "";
  const seasonOrRuntimeText = isTv
    ? [
      mediaItem?.number_of_seasons ? `시즌 ${mediaItem.number_of_seasons}` : null,
      mediaItem?.number_of_episodes ? `${mediaItem.number_of_episodes}부작` : null,
    ].filter(Boolean).join(" / ")
    : mediaItem?.runtime ? `${mediaItem.runtime}분` : "";
  const primaryGenreName = mediaItem?.genres?.[0]?.name ?? "";
  const tvStatusText = mediaItem?.status === "Ended" || mediaItem?.status === "Canceled" ? "완결" : "진행중";
  const heroTypeBadgeText = isTv
    ? `${primaryGenreName || "시리즈"}${mediaItem?.number_of_seasons ? ` · 시즌 ${mediaItem.number_of_seasons} ${tvStatusText}` : ""}`
    : "영화";
  const moodTags = getMoodTags(mediaItem?.genres);
  const castKey = `${type}-${mediaId}`;
  const castList: CastMember[] = casts[castKey] ?? [];

  useEffect(() => {
    const measureSynopsis = () => {
      const synopsisNode = synopsisRef.current;
      if (!synopsisNode) return;

      const lineHeight = Number.parseFloat(window.getComputedStyle(synopsisNode).lineHeight);
      setCanExpandSynopsis(synopsisNode.scrollHeight > lineHeight * 3 + 1);
    };

    const timeoutId = window.setTimeout(measureSynopsis, 0);
    window.addEventListener("resize", measureSynopsis);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", measureSynopsis);
    };
  }, [mediaItem?.overview, activeTab, isTv]);

  const rawCert = certifications[castKey] ?? "";
  const ageBadge = ((): "ALL" | "12+" | "15+" | "19+" => {
    if (rawCert === "12") return "12+";
    if (rawCert === "15") return "15+";
    if (rawCert === "19" || rawCert === "Restricted Screening") return "19+";
    return "ALL";
  })();
  const heroMetaItems = [releaseYear, seasonOrRuntimeText, countryText].filter(Boolean);
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
  const relatedItems = recommended
    .filter((item: RecommendedItem) => item.id !== mediaId)
    .slice(0, 6);
  const isMyListAdded = myList.some((item) => item.id === mediaId && item.mediaType === type);
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
    ...(!isTv ? [{ id: "info" as const, label: "작품 정보" }] : []),
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
      if (isMyListAdded) {
        await onRemoveMyList(mediaId, type);
      } else {
        await onAddMyList(mediaItem);
      }
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

  const handleOpenReportReview = (reviewId: number) => {
    setReportTargetReviewId((currentId) => currentId === reviewId ? null : reviewId);
    setSelectedReportReason("");
  };

  const handleSubmitReportReview = () => {
    if (!reportTargetReviewId || !selectedReportReason) return;

    setReportedReviewIds((prev) => (
      prev.includes(reportTargetReviewId) ? prev : [...prev, reportTargetReviewId]
    ));
    setReportTargetReviewId(null);
    setSelectedReportReason("");
    window.alert("신고되었습니다.");
  };

  const toggleReviewLike = (reviewId: number) => {
    setLikedReviewIds((prev) => (
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    ));
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
    const getVisibleEpisodePages = () => {
      const maxVisible = 5;
      if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, index) => index + 1);

      const half = Math.floor(maxVisible / 2);
      let start = Math.max(1, episodePage - half);
      const endOverflow = start + maxVisible - 1 - totalPages;

      if (endOverflow > 0) {
        start = Math.max(1, start - endOverflow);
      }

      return Array.from({ length: maxVisible }, (_, index) => start + index);
    };
    const visibleEpisodePages = getVisibleEpisodePages();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "48px 40px 0" }}>
        {isTv && renderSynopsis({ compact: true })}

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
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
          <button style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginTop: 8, background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer" }}>
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
              onClick={() => setEpisodePage(1)}
              disabled={episodePage === 1}
              style={{ background: "none", border: "1px solid #3a3a48", color: episodePage === 1 ? "#444" : "#888", width: 34, height: 34, borderRadius: 4, cursor: episodePage === 1 ? "default" : "pointer", fontSize: 13, letterSpacing: -3 }}
            >
              {"<<"}
            </button>
            <button
              onClick={() => setEpisodePage((p) => Math.max(1, p - 1))}
              disabled={episodePage === 1}
              style={{ background: "none", border: "1px solid #3a3a48", color: episodePage === 1 ? "#444" : "#888", width: 34, height: 34, borderRadius: 4, cursor: episodePage === 1 ? "default" : "pointer", fontSize: 14 }}
            >
              {"<"}
            </button>
            {visibleEpisodePages.map((page) => (
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
              {">"}
            </button>
            <button
              onClick={() => setEpisodePage(totalPages)}
              disabled={episodePage === totalPages}
              style={{ background: "none", border: "1px solid #3a3a48", color: episodePage === totalPages ? "#444" : "#888", width: 34, height: 34, borderRadius: 4, cursor: episodePage === totalPages ? "default" : "pointer", fontSize: 13, letterSpacing: -3 }}
            >
              {">>"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSynopsis = ({ compact = false }: { compact?: boolean } = {}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: compact ? "0 0 24px" : "56px 40px 0" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
        {isTv ? "시리즈 줄거리" : "영화 줄거리"}
      </h2>
      <div style={{ position: "relative" }}>
        <p ref={synopsisRef} style={{
          fontSize: 16, color: "#ccc", lineHeight: 1.72, margin: 0,
          overflow: "hidden",
          display: synopsisExpanded ? "block" : "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: synopsisExpanded ? "unset" : 3,
          maxWidth: "100%",
        }}>
          {mediaItem?.overview}
        </p>
      </div>
      {mediaItem?.overview && canExpandSynopsis && (
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
          className="detail-review-textarea"
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          placeholder="이 작품에 대한 감상을 남겨보세요."
          style={{
            width: "100%",
            height: 130,
            resize: "none",
            overflowY: "auto",
            boxSizing: "border-box",
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
            {/* {reviewHasSpoiler ? "스포일러 포함" : "스포일러 없음"} */}
            스포일러
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
          {pagedReviews.map((review) => {
            const isReported = reportedReviewIds.includes(review.id);
            const isLiked = likedReviewIds.includes(review.id);
            const shouldBlurSpoiler = review.spoiler && !visibleSpoilerReviewIds.includes(review.id);

            return (
              <article
                key={review.id}
                style={{
                  border: "1px solid #2a2a35",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.025)",
                  padding: 18,
                }}
              >
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
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
                    className={`detail-outline-hover${isReported ? " detail-report-active" : ""}`}
                    onClick={() => handleOpenReportReview(review.id)}
                    aria-pressed={isReported}
                    style={{
                      border: `1px solid ${isReported ? "rgba(229,9,20,0.7)" : "#3a3a48"}`,
                      borderRadius: 4,
                      background: isReported ? "rgba(229,9,20,0.16)" : "transparent",
                      color: isReported ? "#e50914" : "#888",
                      height: 30,
                      padding: "0 10px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: isReported ? 700 : 400,
                    }}
                  >
                    {/* {isReported ? "신고됨" : "신고"} */}
                    신고
                  </button>
                  {reportTargetReviewId === review.id && (
                    <div style={{
                      position: "absolute",
                      top: 36,
                      right: 0,
                      zIndex: 20,
                      width: 260,
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      background: "#191919",
                      padding: 12,
                      boxShadow: "0 14px 42px rgba(0,0,0,0.42)",
                    }}>
                      <p style={{ margin: "0 0 10px", color: "#d8d8d8", fontSize: 13, fontWeight: 800 }}>신고 사유</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {REPORT_REASONS.map((reason) => (
                          <button
                            type="button"
                            key={reason}
                            onClick={() => setSelectedReportReason(reason)}
                            style={{
                              minHeight: 34,
                              padding: "0 10px",
                              border: `1px solid ${selectedReportReason === reason ? "rgba(229,9,20,0.7)" : "#333"}`,
                              borderRadius: 6,
                              background: selectedReportReason === reason ? "rgba(229,9,20,0.14)" : "rgba(255,255,255,0.03)",
                              color: selectedReportReason === reason ? "#fff" : "#aaa",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => setReportTargetReviewId(null)}
                          style={{ height: 30, padding: "0 10px", border: "1px solid #333", borderRadius: 5, background: "transparent", color: "#888", cursor: "pointer", fontSize: 12 }}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitReportReview}
                          disabled={!selectedReportReason}
                          style={{ height: 30, padding: "0 10px", border: "none", borderRadius: 5, background: "#e50914", color: "#fff", cursor: selectedReportReason ? "pointer" : "default", opacity: selectedReportReason ? 1 : 0.45, fontSize: 12, fontWeight: 800 }}
                        >
                          신고
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 6,
                  minHeight: shouldBlurSpoiler ? 96 : "auto",
                }}>
                  <div style={{
                    minHeight: shouldBlurSpoiler ? 96 : "auto",
                    filter: shouldBlurSpoiler ? "blur(6px)" : "none",
                    opacity: shouldBlurSpoiler ? 0.72 : 1,
                    userSelect: shouldBlurSpoiler ? "none" : "auto",
                    transition: "filter 0.18s ease, opacity 0.18s ease",
                  }}>
                    <p style={{
                      margin: 0,
                      color: "#cfcfcf",
                      lineHeight: 1.7,
                      fontSize: 14,
                    }}>
                      {review.content}
                    </p>
                  </div>
                  {shouldBlurSpoiler && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "radial-gradient(circle at center, rgba(20,20,20,0.72) 0%, rgba(20,20,20,0.58) 46%, rgba(20,20,20,0.32) 100%)",
                      backdropFilter: "blur(3px)",
                    }}>
                      <button
                        type="button"
                        className="detail-secondary-hover"
                        onClick={() => setVisibleSpoilerReviewIds((prev) => [...prev, review.id])}
                        style={{
                          height: 34,
                          padding: "0 16px",
                          border: "1px solid rgba(255,255,255,0.28)",
                          borderRadius: 6,
                          background: "rgba(255,255,255,0.12)",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 800,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.26)",
                        }}
                      >
                        그래도 리뷰 보기
                      </button>
                    </div>
                  )}
                </div>
                <time style={{ display: "block", marginTop: 12, color: "#666", fontSize: 12 }}>{review.createdAt}</time>
                <button
                  type="button"
                  className="detail-secondary-hover"
                  onClick={() => toggleReviewLike(review.id)}
                  aria-pressed={isLiked}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 32,
                    marginTop: 10,
                    padding: "0 10px",
                    border: `1px solid ${isLiked ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.24)"}`,
                    borderRadius: 999,
                    background: isLiked ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.08)",
                    color: isLiked ? "#111" : "#d6d6d6",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  <img
                    src={isLiked ? "/images/detail/review/review-thumbup-black.svg" : "/images/detail/review/review-thumbup.svg"}
                    alt=""
                    style={{
                      width: 14,
                      height: 14,
                      objectFit: "contain",
                      opacity: isLiked ? 1 : 0.86,
                      filter: isLiked ? "none" : "invert(1)",
                    }}
                  />
                  좋아요
                </button>
              </article>
            );
          })}
        </div>

        {totalReviewPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 8 }}>
            <button
              type="button"
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
              {isHovered && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", justifyContent: "flex-end",
                  padding: 12,
                  background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
                  gap: 5,
                }}>
                  <span style={{ fontSize: 12, padding: "2px 7px", borderRadius: 3, background: "rgba(255,255,255,0.15)", color: "#ccc", alignSelf: "flex-start" }}>
                    {item.media_type === "tv" ? "시리즈" : "영화"}
                  </span>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.5 }}>
                    {item.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {item.vote_average > 0 && (
                      <span style={{ fontSize: 16, color: "#e50914", fontWeight: 700 }}>★ {item.vote_average.toFixed(1)}</span>
                    )}
                    {item.release_date && (
                      <span style={{ fontSize: 16, color: "#888" }}>{item.release_date.slice(0, 4)}</span>
                    )}
                  </div>
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
    <div style={{ background: "#141414", minHeight: "100vh" }}>

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
            <div>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                height: 30,
                padding: "0 11px",
                borderRadius: 5,
                background: "rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.72)",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 0,
              }}>
                {heroTypeBadgeText}
              </span>
            </div>

            <h1 style={{ fontWeight: 900, fontSize: 40, color: "#fff", lineHeight: 1.15, letterSpacing: -0.8, margin: 0 }}>
              {title}
            </h1>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {heroMetaItems.map((item, index) => (
                  <React.Fragment key={item}>
                    {index > 0 && <span style={{ color: "#444" }}>·</span>}
                    <span style={{ fontSize: 14, color: "#888" }}>{item}</span>
                  </React.Fragment>
                ))}
                {heroMetaItems.length > 0 && <span style={{ color: "#444" }}>·</span>}
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 38,
                  height: 24,
                  padding: "0 8px",
                  border: "1px solid rgba(255,255,255,0.35)",
                  borderRadius: 3,
                  color: "rgba(255,255,255,0.78)",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1,
                }}>
                  {ageBadge}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {mediaItem?.genres?.slice(0, 3).map((g) => (
                  <span key={g.id} style={{ padding: "2px 10px", borderRadius: 100, border: "1px solid #555", fontSize: 11, color: "#999" }}>
                    {g.name}
                  </span>
                ))}
                {moodTags.map((mood) => (
                  <span key={mood} style={{ padding: "2px 10px", borderRadius: 100, border: "1px solid #555", fontSize: 11, color: "#999" }}>
                    {mood}
                  </span>
                ))}
                {/* {countryText && <span style={{ fontSize: 14, color: "#888" }}>{countryText}</span>} */}
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
                className={`detail-secondary-hover${isMyListAdded ? " detail-my-list-added" : ""}`}
                onClick={handleMyList}
                disabled={isAddingMyList}
                aria-pressed={isMyListAdded}
                style={{
                  background: isMyListAdded ? "rgba(229,9,20,0.24)" : "rgba(255,255,255,0.1)",
                  color: "#fff",
                  height: 46,
                  padding: "0 18px",
                  fontSize: 16,
                  fontWeight: 700,
                  border: `1px solid ${isMyListAdded ? "rgba(229,9,20,0.72)" : "rgba(255,255,255,0.25)"}`,
                  borderRadius: 4,
                  cursor: isAddingMyList ? "default" : "pointer",
                  opacity: isAddingMyList ? 0.7 : 1,
                }}
              >
                {isMyListAdded ? "✓ 내 리스트" : "＋ 내 리스트"}
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
              {/* <button className="detail-circle-hover" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)", color: "#888", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                🔔
              </button>   */}
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
        {activeTab === "info" && !isTv && renderSynopsis()}
        {activeTab === "info" && !isTv && renderRelated()}
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
