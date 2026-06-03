"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/firebase/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { type FeedView, useFeedStore } from "@/store/useFeedStore";
import {
  FeedMediaOption,
  FeedReview,
  FeedTab,
  REPORT_REASONS,
  getInitial,
  getRelativeTime,
  getPosterUrl,
} from "@/types/feedData";
import "../scss/feed.scss";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

type ReviewFinderOption = {
  label: string;
  value: string;
  icon: string;
  group: "mood" | "genre";
  query: Record<string, string>;
  tvQuery?: Record<string, string>;
};

type TmdbMultiSearchItem = {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

const reviewMoodOptions: ReviewFinderOption[] = [
  { label: "힐링", value: "chill", icon: "/images/header/menu/mood-chill.svg", group: "mood", query: { with_genres: "18,10749" }, tvQuery: { with_genres: "18" } },
  { label: "다크", value: "dark", icon: "/images/header/menu/mood-dark.svg", group: "mood", query: { with_genres: "53,9648" }, tvQuery: { with_genres: "80,9648" } },
  { label: "감성적", value: "emotional", icon: "/images/header/menu/mood-emotional.svg", group: "mood", query: { with_genres: "18,10749" } },
  { label: "신나는", value: "exciting", icon: "/images/header/menu/mood-exciting.svg", group: "mood", query: { with_genres: "28,12" }, tvQuery: { with_genres: "10759,10765" } },
  { label: "웃긴", value: "funny", icon: "/images/header/menu/mood-funny.svg", group: "mood", query: { with_genres: "35" } },
  { label: "로맨틱", value: "romantic", icon: "/images/header/menu/mood-romantic.svg", group: "mood", query: { with_genres: "10749,35" }, tvQuery: { with_genres: "10749" } },
  { label: "무서운", value: "scary", icon: "/images/header/menu/mood-scary.svg", group: "mood", query: { with_genres: "27" }, tvQuery: { with_genres: "9648" } },
  { label: "생각나는", value: "thoughtful", icon: "/images/header/menu/mood-thoughtful.svg", group: "mood", query: { with_genres: "18,99" } },
];

const reviewGenreOptions: ReviewFinderOption[] = [
  { label: "액션", value: "action", icon: "/images/header/menu/genre-action.svg", group: "genre", query: { with_genres: "28" }, tvQuery: { with_genres: "10759" } },
  { label: "애니메이션", value: "animation", icon: "/images/header/menu/genre-animation.svg", group: "genre", query: { with_genres: "16" }, tvQuery: { with_genres: "16" } },
  { label: "코미디", value: "comedy", icon: "/images/header/menu/genre-comedy.svg", group: "genre", query: { with_genres: "35" } },
  { label: "다큐멘터리", value: "documentary", icon: "/images/header/menu/genre-documentary.svg", group: "genre", query: { with_genres: "99" }, tvQuery: { with_genres: "99" } },
  { label: "드라마", value: "drama", icon: "/images/header/menu/genre-drama.svg", group: "genre", query: { with_genres: "18" } },
  { label: "판타지", value: "fantasy", icon: "/images/header/menu/genre-fantasy.svg", group: "genre", query: { with_genres: "14" }, tvQuery: { with_genres: "10765" } },
  { label: "공포", value: "horror", icon: "/images/header/menu/genre-horror.svg", group: "genre", query: { with_genres: "27" }, tvQuery: { with_genres: "9648" } },
  { label: "미스터리", value: "mystery", icon: "/images/header/menu/genre-mystery.svg", group: "genre", query: { with_genres: "9648" }, tvQuery: { with_genres: "9648" } },
  { label: "로맨스", value: "romance", icon: "/images/header/menu/genre-romance.svg", group: "genre", query: { with_genres: "10749" } },
  { label: "SF", value: "scifi", icon: "/images/header/menu/genre-scifi.svg", group: "genre", query: { with_genres: "878" }, tvQuery: { with_genres: "10765" } },
  { label: "스릴러", value: "thriller", icon: "/images/header/menu/genre-thriller.svg", group: "genre", query: { with_genres: "53" }, tvQuery: { with_genres: "9648" } },
  { label: "전쟁", value: "war", icon: "/images/header/menu/genre-war.svg", group: "genre", query: { with_genres: "10752" }, tvQuery: { with_genres: "10768" } },
];

const makeSearchMediaOption = (
  item: TmdbMultiSearchItem,
  fallbackMediaType?: "movie" | "tv",
): FeedMediaOption | null => {
  const mediaType = item.media_type === "movie" || item.media_type === "tv"
    ? item.media_type
    : fallbackMediaType;

  if (!mediaType) return null;

  const title = mediaType === "movie" ? item.title : item.name;
  if (!title) return null;

  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const typeLabel = mediaType === "movie" ? "영화" : "시리즈";
  const rating = typeof item.vote_average === "number" && item.vote_average > 0
    ? ` · 평균 ${item.vote_average.toFixed(1)}`
    : "";

  return {
    id: item.id,
    mediaType,
    title,
    posterPath: item.poster_path || undefined,
    meta: `${typeLabel}${year ? ` · ${year}` : ""}${rating}`,
  };
};

const renderRatingStars = (rating: number) => (
  <span className="rating-stars" aria-label={`${rating.toFixed(1)}점`}>
    {[1, 2, 3, 4, 5].map((star) => {
      const fillPercent = Math.max(0, Math.min(1, rating - (star - 1))) * 100;

      return (
        <span
          className="rating-star"
          key={star}
          style={{ "--fill": `${fillPercent}%` } as React.CSSProperties}
          aria-hidden="true"
        >
          ★
        </span>
      );
    })}
  </span>
);

const getStarFill = (rating: number, star: number) => Math.max(0, Math.min(1, rating - (star - 1))) * 100;

const getNextStarRating = (currentRating: number, star: number) => {
  const halfRating = star - 0.5;

  return currentRating === halfRating ? star : halfRating;
};

export default function FeedPage() {
  const { user, currentProfile } = useAuthStore();
  const { reviews, onAddComment, onAddReview, onDeleteComment, onDeleteReview, onHydrateReviews, onReportReview, onToggleLike, onUpdateComment, onUpdateReview } = useFeedStore();
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [visibleSpoilerReviewIds, setVisibleSpoilerReviewIds] = useState<string[]>([]);
  const [reportedReviewIds, setReportedReviewIds] = useState<string[]>([]);
  const [reportTargetReviewId, setReportTargetReviewId] = useState<string | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState("");
  const [copiedReviewId, setCopiedReviewId] = useState<string | null>(null);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [commentTargetReviewId, setCommentTargetReviewId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [selectedReviewTag, setSelectedReviewTag] = useState<ReviewFinderOption | null>(null);
  const [searchMediaOptions, setSearchMediaOptions] = useState<FeedMediaOption[]>([]);
  const [isSearchingMedia, setIsSearchingMedia] = useState(false);
  const [mediaSearchError, setMediaSearchError] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<FeedMediaOption | null>(null);
  const [newRating, setNewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState("");
  const [newHasSpoiler, setNewHasSpoiler] = useState(false);
  const [newIsPublic, setNewIsPublic] = useState(true);
  const currentUserId = user?.userId || (user as { uid?: string } | null)?.uid || auth.currentUser?.uid;

  const closeWriteModal = useCallback(() => {
    setWriteModalOpen(false);
    setEditingReviewId(null);
    setReviewSearch("");
    setSelectedReviewTag(null);
    setSearchMediaOptions([]);
    setIsSearchingMedia(false);
    setMediaSearchError("");
    setSelectedMedia(null);
    setNewRating(0);
    setNewReviewText("");
    setNewHasSpoiler(false);
    setNewIsPublic(true);
  }, []);

  const closeCommentModal = useCallback(() => {
    setCommentTargetReviewId(null);
    setEditingCommentId(null);
    setCommentText("");
  }, []);

  useEffect(() => {
    void onHydrateReviews();
  }, [currentProfile?.id, currentUserId, onHydrateReviews]);

  useEffect(() => {
    if (!writeModalOpen && !commentTargetReviewId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeWriteModal();
        closeCommentModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeCommentModal, closeWriteModal, commentTargetReviewId, writeModalOpen]);

  useEffect(() => {
    const keyword = reviewSearch.trim();

    if (!writeModalOpen || (!keyword && !selectedReviewTag)) {
      return;
    }

    if (!TMDB_KEY) {
      const timeoutId = window.setTimeout(() => {
        setSearchMediaOptions([]);
        setIsSearchingMedia(false);
        setMediaSearchError("검색 설정을 확인해 주세요.");
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsSearchingMedia(true);
      setMediaSearchError("");

      const commonParams = {
        api_key: TMDB_KEY,
        language: "ko-KR",
        include_adult: "false",
        page: "1",
      };

      const searchRequest = selectedReviewTag
        ? Promise.all((["movie", "tv"] as const).map((mediaType) => {
            const tagQuery = mediaType === "tv" && selectedReviewTag.tvQuery
              ? selectedReviewTag.tvQuery
              : selectedReviewTag.query;
            const params = new URLSearchParams({
              ...commonParams,
              ...tagQuery,
              sort_by: "popularity.desc",
              "vote_count.gte": "80",
            });

            return fetch(`https://api.themoviedb.org/3/discover/${mediaType}?${params.toString()}`, {
              signal: abortController.signal,
            })
              .then((response) => {
                if (!response.ok) throw new Error("Failed to search tagged media.");
                return response.json();
              })
              .then((data: { results?: TmdbMultiSearchItem[] }) => (
                (data.results || [])
                  .map((item) => makeSearchMediaOption(item, mediaType))
                  .filter((item): item is FeedMediaOption => Boolean(item))
              ));
          })).then((results) => results.flat())
        : (() => {
            const params = new URLSearchParams({
              ...commonParams,
              query: keyword,
            });

            return fetch(`https://api.themoviedb.org/3/search/multi?${params.toString()}`, {
              signal: abortController.signal,
            })
              .then((response) => {
                if (!response.ok) throw new Error("Failed to search media.");
                return response.json();
              })
              .then((data: { results?: TmdbMultiSearchItem[] }) => (
                (data.results || [])
                  .map((item) => makeSearchMediaOption(item))
                  .filter((item): item is FeedMediaOption => Boolean(item))
              ));
          })();

      searchRequest
        .then((nextOptions) => {
          const uniqueOptions = Array.from(
            new Map(nextOptions.map((item) => [`${item.mediaType}-${item.id}`, item])).values(),
          ).slice(0, 8);

          setSearchMediaOptions(uniqueOptions);
          setMediaSearchError("");
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setSearchMediaOptions([]);
          setMediaSearchError("검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setIsSearchingMedia(false);
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [reviewSearch, selectedReviewTag, writeModalOpen]);

  const hasReviewSearchKeyword = reviewSearch.trim().length > 0 || Boolean(selectedReviewTag);

  const handleChangeReviewSearch = (value: string) => {
    setReviewSearch(value);
    setSelectedReviewTag(null);

    if (!value.trim()) {
      setSearchMediaOptions([]);
      setIsSearchingMedia(false);
      setMediaSearchError("");
    } else {
      setIsSearchingMedia(true);
      setMediaSearchError("");
    }
  };

  const handleSelectReviewTag = (option: ReviewFinderOption) => {
    setReviewSearch("");
    setSelectedReviewTag(option);
    setSearchMediaOptions([]);
    setIsSearchingMedia(true);
    setMediaSearchError("");
  };

  const handleClearReviewTag = () => {
    setSelectedReviewTag(null);
    setSearchMediaOptions([]);
    setIsSearchingMedia(false);
    setMediaSearchError("");
  };

  const filteredReviews = activeTab === "all"
    ? reviews
    : reviews.filter((review) => review.isFollowing);

  const selectedCommentReview = reviews.find((review) => review.feedId === commentTargetReviewId) ?? null;

  const handleLike = (feedId: string) => {
    if (!currentUserId) {
      window.alert("로그인이 필요합니다.");
      return;
    }
    if (!currentProfile) {
      window.alert("프로필을 선택해 주세요.");
      return;
    }

    void onToggleLike(feedId);
  };

  const handleOpenReportReview = (reviewId: string) => {
    setReportTargetReviewId((currentId) => currentId === reviewId ? null : reviewId);
    setSelectedReportReason("");
  };

  const handleSubmitReportReview = () => {
    if (!reportTargetReviewId || !selectedReportReason) return;

    void onReportReview(reportTargetReviewId);
    setReportedReviewIds((prev) => (
      prev.includes(reportTargetReviewId) ? prev : [...prev, reportTargetReviewId]
    ));
    setReportTargetReviewId(null);
    setSelectedReportReason("");
    window.alert("신고되었습니다.");
  };

  const handleCopyShareLink = (reviewId: string) => {
    const shareUrl = `${window.location.origin}/feed/${reviewId}`;

    setCopiedReviewId(reviewId);
    window.setTimeout(() => setCopiedReviewId(null), 1600);
    void navigator.clipboard.writeText(shareUrl);
  };

  const handleOpenEditReview = (review: FeedView) => {
    setEditingReviewId(review.feedId);
    setSelectedMedia({
      id: review.mediaId,
      mediaType: review.mediaType,
      title: review.mediaTitle,
      posterPath: review.mediaPoster,
      meta: review.mediaMeta,
    });
    setReviewSearch(review.mediaTitle);
    setSelectedReviewTag(null);
    setNewRating(review.rating);
    setNewReviewText(review.content);
    setNewHasSpoiler(review.isSpoiler);
    setNewIsPublic(review.isPublic);
    setWriteModalOpen(true);
  };

  const handleSubmitComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCommentReview || !commentText.trim()) return;
    if (!currentUserId) {
      window.alert("로그인이 필요합니다.");
      return;
    }
    if (!currentProfile) {
      window.alert("프로필을 선택해 주세요.");
      return;
    }

    if (editingCommentId) {
      void onUpdateComment(selectedCommentReview.feedId, editingCommentId, commentText.trim());
      setEditingCommentId(null);
      setCommentText("");
      return;
    }

    const now = new Date().toISOString();
    const nextComment = {
      commentId: "",
      userId: currentUserId,
      profileId: currentProfile.id,
      content: commentText.trim(),
      reportsCount: 0,
      likesCount: 0,
      createdAt: now,
      updatedAt: now,
      isDelete: false,
    };

    void onAddComment(selectedCommentReview.feedId, nextComment);
    setCommentText("");
  };

  const handleOpenEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setCommentText(text);
  };

  const handleDeleteComment = (reviewId: string, commentId: string) => {
    void onDeleteComment(reviewId, commentId);
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setCommentText("");
    }
  };

  const handleSubmitReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMedia || newRating === 0 || !newReviewText.trim()) return;
    if (!currentUserId) {
      window.alert("로그인이 필요합니다.");
      return;
    }
    if (!currentProfile) {
      window.alert("프로필을 선택해 주세요.");
      return;
    }

    const editingReview = editingReviewId
      ? reviews.find((review) => review.feedId === editingReviewId)
      : null;

    if (editingReview) {
      void onUpdateReview({
        ...editingReview,
        videoId: `${selectedMedia.mediaType}-${selectedMedia.id}`,
        rating: newRating,
        content: newReviewText.trim(),
        isSpoiler: newHasSpoiler,
        isPublic: newIsPublic,
      });
      closeWriteModal();
      return;
    }

    const nextReview: FeedReview = {
      feedId: "",
      userId: currentUserId,
      profileId: currentProfile.id,
      videoId: `${selectedMedia.mediaType}-${selectedMedia.id}`,
      content: newReviewText.trim(),
      likesCount: 0,
      reportsCount: 0,
      createdAt: new Date().toISOString(),
      isDelete: false,
      rating: newRating,
      isSpoiler: newHasSpoiler,
      isPublic: newIsPublic,
      likedUserIds: [],
    };

    void onAddReview(nextReview);
    closeWriteModal();
  };

  const renderWriteModal = () => {
    if (!writeModalOpen) return null;

    return (
      <div
        className="feed-modal-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeWriteModal();
          }
        }}
      >
        <section className="feed-write-modal" role="dialog" aria-modal="true" aria-labelledby="feed-write-title">
          <form onSubmit={handleSubmitReview}>
            <div className="feed-modal-head">
              <div>
                <h3 id="feed-write-title">{editingReviewId ? "리뷰 수정" : "리뷰 작성"}</h3>
                <p>작품을 선택하고 커뮤니티에 공개할 리뷰를 남겨보세요.</p>
              </div>
              <button type="button" className="feed-modal-close" onClick={closeWriteModal} aria-label="리뷰 작성 닫기">
                ×
              </button>
            </div>

            <div className="feed-write-fields">
              <label className="feed-search-field">
                <span>작품 검색</span>
                <div className="feed-search-input">
                  {selectedReviewTag && (
                    <span className="feed-selected-tag">
                      <img src={selectedReviewTag.icon} alt="" />
                      {selectedReviewTag.label}
                      <button type="button" onClick={handleClearReviewTag} aria-label={`${selectedReviewTag.label} 태그 삭제`}>
                        ×
                      </button>
                    </span>
                  )}
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(event) => handleChangeReviewSearch(event.target.value)}
                    placeholder={selectedReviewTag ? "" : "작품 제목을 입력해 주세요"}
                  />
                </div>
              </label>

              {hasReviewSearchKeyword ? (
                <div className="feed-search-results-wrap">
                  {isSearchingMedia && <p className="feed-media-status">검색 중...</p>}
                  {!isSearchingMedia && mediaSearchError && (
                    <p className="feed-media-status is-error">{mediaSearchError}</p>
                  )}
                  {!isSearchingMedia && !mediaSearchError && searchMediaOptions.length === 0 && (
                    <p className="feed-media-status">{selectedReviewTag ? "이 태그에 맞는 결과가 없어요." : "검색 결과가 없어요."}</p>
                  )}

                  {searchMediaOptions.length > 0 && (
                    <div className="feed-media-results">
                      {searchMediaOptions.map((item) => (
                        <button
                          type="button"
                          key={`${item.mediaType}-${item.id}`}
                          className={selectedMedia?.id === item.id && selectedMedia.mediaType === item.mediaType ? "selected" : ""}
                          onClick={() => setSelectedMedia(item)}
                        >
                          {item.posterPath ? (
                            <img src={getPosterUrl(item.posterPath)} alt="" />
                          ) : (
                            <span className="feed-poster-fallback" aria-hidden="true">
                              {item.title.slice(0, 1)}
                            </span>
                          )}
                          <span>
                            <strong>{item.title}</strong>
                            <em>{item.meta}</em>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="feed-review-finder">
                  <section>
                    <div className="feed-review-finder__header">
                      <strong>무드로 찾기</strong>
                      <span>오늘 보고 싶은 감정으로 골라보세요.</span>
                    </div>
                    <div className="feed-review-option-grid feed-review-option-grid--mood">
                      {reviewMoodOptions.map((option) => (
                        <button type="button" key={option.value} onClick={() => handleSelectReviewTag(option)}>
                          <img src={option.icon} alt="" />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="feed-review-finder__header">
                      <strong>장르로 찾기</strong>
                      <span>자주 찾는 장르를 빠르게 입력해요.</span>
                    </div>
                    <div className="feed-review-option-grid feed-review-option-grid--genre">
                      {reviewGenreOptions.map((option) => (
                        <button type="button" key={option.value} onClick={() => handleSelectReviewTag(option)}>
                          <img src={option.icon} alt="" />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              <div className="feed-rating-field">
                <span>별점</span>
                <div className="feed-rating-control">
                  <div className="feed-rating-value">
                    <div className="feed-half-stars" aria-label="별점 선택">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          className="feed-half-star"
                          key={star}
                          onClick={() => setNewRating((currentRating) => getNextStarRating(currentRating, star))}
                          aria-label={`${star}점, 더블 클릭하면 ${star - 0.5}점`}
                          style={{ "--fill": `${getStarFill(newRating, star)}%` } as React.CSSProperties}
                        >
                          <span aria-hidden="true">★</span>
                        </button>
                      ))}
                    </div>
                    <em>{newRating.toFixed(1)} / 5.0</em>
                  </div>
                </div>
              </div>

              <label className="feed-review-field">
                <span>리뷰</span>
                <textarea
                  value={newReviewText}
                  onChange={(event) => setNewReviewText(event.target.value)}
                  placeholder="리뷰를 작성해 주세요"
                />
              </label>

              <div className="feed-write-toggles">
                <button
                  type="button"
                  className={newHasSpoiler ? "active" : ""}
                  onClick={() => setNewHasSpoiler((value) => !value)}
                  aria-pressed={newHasSpoiler}
                >
                  스포일러
                </button>
                <button
                  type="button"
                  className={newIsPublic ? "active" : ""}
                  onClick={() => setNewIsPublic((value) => !value)}
                  aria-pressed={newIsPublic}
                >
                  {/* {newIsPublic ? "커뮤니티 공개" : "비공개"} */}
                  커뮤니티 공개
                </button>
              </div>
            </div>

            <div className="feed-modal-actions">
              <button type="button" className="feed-cancel-btn" onClick={closeWriteModal}>
                취소
              </button>
              <button
                type="submit"
                className="feed-submit-btn"
                disabled={!selectedMedia || newRating === 0 || !newReviewText.trim()}
              >
                {editingReviewId ? "수정" : "등록"}
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  };

  const renderCommentModal = () => {
    if (!selectedCommentReview) return null;

    return (
      <div
        className="feed-modal-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeCommentModal();
          }
        }}
      >
        <section className="feed-comment-modal" role="dialog" aria-modal="true" aria-labelledby="feed-comment-title">
          <div className="feed-modal-head">
            <div>
              <h3 id="feed-comment-title">댓글</h3>
              <p>{selectedCommentReview.mediaTitle} 리뷰에 남긴 의견</p>
            </div>
            <button type="button" className="feed-modal-close" onClick={closeCommentModal} aria-label="댓글 닫기">
              ×
            </button>
          </div>

          <div className="comment-list">
            {selectedCommentReview.commentsList.length > 0 ? (
              selectedCommentReview.commentsList.map((comment) => (
	                <div className="comment-item" key={comment.commentId}>
	                  <div className="comment-avatar">
	                    {comment.authorImage ? (
	                      <img src={comment.authorImage} alt="" />
	                    ) : (
	                      getInitial(comment.author)
	                    )}
	                  </div>
                  <div className="comment-content">
                    <div className="comment-meta">
                      <strong>
                        {comment.author}
                      </strong>
                      <span>{getRelativeTime(comment.updatedAt || comment.createdAt)}</span>
                    </div>
                    <p>{comment.content}</p>
                    <div className="comment-actions">
                      <button type="button">좋아요 {comment.likesCount}</button>
                      {comment.isMine && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditComment(comment.commentId, comment.content)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="comment-delete-btn"
                            onClick={() => handleDeleteComment(selectedCommentReview.feedId, comment.commentId)}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="comment-empty">아직 댓글이 없어요.</div>
            )}
          </div>

          <form className="comment-write" onSubmit={handleSubmitComment}>
            <input
              type="text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="댓글을 입력해 주세요"
            />
            <button type="submit" disabled={!commentText.trim()}>
              {editingCommentId ? "수정" : "등록"}
            </button>
          </form>
        </section>
      </div>
    );
  };

  return (
    <div className="feed-page">
      <div className="inner">
        <div className="page-head feed-page-head">
          <div>
            <h1>피드</h1>
            <p>커뮤니티 리뷰와 팔로우한 유저의 감상을 둘러보세요.</p>
          </div>
          <button type="button" className="feed-write-btn" onClick={() => setWriteModalOpen(true)}>
            리뷰 작성
          </button>
        </div>

        <div className="filter-chips">
          <button className={activeTab === "all" ? "chip active" : "chip"} onClick={() => setActiveTab("all")}>
            전체
          </button>
          <button className={activeTab === "following" ? "chip active" : "chip"} onClick={() => setActiveTab("following")}>
            팔로워 리뷰
          </button>
        </div>

        <div className="feed-layout">
          <div className="feed-main">
            {filteredReviews.map((review) => {
              const isReported = reportedReviewIds.includes(review.feedId);
              const shouldBlurSpoiler = review.isSpoiler && !visibleSpoilerReviewIds.includes(review.feedId);

              return (
                <article key={review.feedId} className="feed-post">
                  <Link href={`/feed/${review.feedId}`} className="feed-card-link" aria-label={`${review.mediaTitle} 피드 상세 보기`} />
	                  <div className="post-head">
	                    <div className="post-avatar">
	                      {review.authorImage ? (
	                        <img src={review.authorImage} alt="" />
	                      ) : (
	                        getInitial(review.author)
	                      )}
	                    </div>
                    <div className="post-meta">
                      <h3>
                        {review.author}
                      </h3>
                      <div className="post-info">
                        <span className="time">{getRelativeTime(review.createdAt)}</span>
                        {!review.isPublic && <span className="private-tag">비공개</span>}
                      </div>
                    </div>
                    <div className="review-tags">
                      {review.isSpoiler && <span className="spoiler-tag">스포일러</span>}
                      <div className="report-menu">
                        <button
                          type="button"
                          className={isReported ? "report-btn active" : "report-btn"}
                          onClick={() => handleOpenReportReview(review.feedId)}
                          aria-pressed={isReported}
                        >
                          신고
                        </button>
                        {reportTargetReviewId === review.feedId && (
                          <div className="feed-report-panel">
                            <p>신고 사유</p>
                            <div className="report-reasons">
                              {REPORT_REASONS.map((reason) => (
                                <button
                                  type="button"
                                  key={reason}
                                  className={selectedReportReason === reason ? "selected" : ""}
                                  onClick={() => setSelectedReportReason(reason)}
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                            <div className="report-actions">
                              <button type="button" onClick={() => setReportTargetReviewId(null)}>
                                취소
                              </button>
                              <button type="button" onClick={handleSubmitReportReview} disabled={!selectedReportReason}>
                                신고
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="post-body review-body">
                    <Link href={`/detail/${review.mediaType}/${review.mediaId}`} className="thumb feed-card-layer">
                      {review.mediaPoster && (
                        <img src={getPosterUrl(review.mediaPoster)} alt={review.mediaTitle} />
                      )}
                    </Link>
                    <div className="review-info">
                      <div className="feed-detail-link">
                        <h4>{review.mediaTitle}</h4>
                        <p className="meta">{review.mediaMeta}</p>
                        <div className="stars">
                          {renderRatingStars(review.rating)}
                          <em>{review.rating.toFixed(1)} / 5.0</em>
                        </div>
                      </div>
                      <div className={shouldBlurSpoiler ? "review-text-wrap spoiler-blurred" : "review-text-wrap"}>
                        <p className="review-text">{review.content}</p>
                        {shouldBlurSpoiler && (
                          <button
                            type="button"
                            className="spoiler-reveal-btn"
                            onClick={() => setVisibleSpoilerReviewIds((prev) => [...prev, review.feedId])}
                          >
                            스포일러 보기
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="post-actions feed-card-layer">
                    <button
                      type="button"
                      className={`action ${review.liked ? "liked" : ""}`}
                      onClick={() => handleLike(review.feedId)}
                    >
                      {review.liked ? "♥" : "♡"} {review.likesCount}
                    </button>
                    <button type="button" className="action" onClick={() => setCommentTargetReviewId(review.feedId)}>
                      댓글 {review.comments}
                    </button>
                    <button
                      type="button"
                      className={copiedReviewId === review.feedId ? "action copied" : "action"}
                      onClick={() => handleCopyShareLink(review.feedId)}
                    >
                      {copiedReviewId === review.feedId ? "복사됨" : "공유"}
                    </button>
                    {review.isMine && (
                      <div className="review-owner-actions">
                        <button
                          type="button"
                          className="action"
                          onClick={() => handleOpenEditReview(review)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="action delete-review-btn"
                          onClick={() => void onDeleteReview(review.feedId)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
      {renderWriteModal()}
      {renderCommentModal()}
    </div>
  );
}
