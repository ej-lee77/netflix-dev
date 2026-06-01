"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedStore } from "@/store/useFeedStore";
import { useMovieStore } from "@/store/useMovieStore";
import {
  FeedMediaOption,
  FeedReview,
  FeedTab,
  REPORT_REASONS,
  getPosterUrl,
} from "./feedData";
import "../scss/feed.scss";

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

export default function FeedPage() {
  const { popMovies, tvs, onFetchPopular, onFetchTvs } = useMovieStore();
  const { currentProfile } = useAuthStore();
  const { reviews, onAddComment, onAddReview, onToggleLike } = useFeedStore();
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [visibleSpoilerReviewIds, setVisibleSpoilerReviewIds] = useState<number[]>([]);
  const [reportedReviewIds, setReportedReviewIds] = useState<number[]>([]);
  const [reportTargetReviewId, setReportTargetReviewId] = useState<number | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState("");
  const [copiedReviewId, setCopiedReviewId] = useState<number | null>(null);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [commentTargetReviewId, setCommentTargetReviewId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<FeedMediaOption | null>(null);
  const [newRating, setNewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState("");
  const [newHasSpoiler, setNewHasSpoiler] = useState(false);
  const [newIsPublic, setNewIsPublic] = useState(true);

  const closeWriteModal = useCallback(() => {
    setWriteModalOpen(false);
    setReviewSearch("");
    setSelectedMedia(null);
    setNewRating(0);
    setNewReviewText("");
    setNewHasSpoiler(false);
    setNewIsPublic(true);
  }, []);

  const closeCommentModal = useCallback(() => {
    setCommentTargetReviewId(null);
    setCommentText("");
  }, []);

  useEffect(() => {
    if (popMovies.length === 0) onFetchPopular();
    if (tvs.length === 0) onFetchTvs();
  }, [onFetchPopular, onFetchTvs, popMovies.length, tvs.length]);

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

  const mediaOptions = useMemo<FeedMediaOption[]>(() => {
    const movieItems = popMovies.slice(0, 8).map((movie) => ({
      id: movie.id,
      mediaType: "movie" as const,
      title: movie.title,
      posterPath: movie.poster_path,
      meta: `영화 · ${movie.release_date?.slice(0, 4) || "연도 미상"} · 평균 ${movie.vote_average?.toFixed(1) || "-"}`,
    }));
    const tvItems = tvs.slice(0, 8).map((tv) => ({
      id: tv.id,
      mediaType: "tv" as const,
      title: tv.name,
      posterPath: tv.poster_path,
      meta: `시리즈 · 평균 ${tv.vote_average?.toFixed(1) || "-"}`,
    }));

    return [...movieItems, ...tvItems];
  }, [popMovies, tvs]);

  const filteredMediaOptions = useMemo(() => {
    const keyword = reviewSearch.trim().toLowerCase();
    if (!keyword) return mediaOptions.slice(0, 6);
    return mediaOptions.filter((item) => item.title.toLowerCase().includes(keyword)).slice(0, 6);
  }, [mediaOptions, reviewSearch]);

  const filteredReviews = activeTab === "all"
    ? reviews
    : reviews.filter((review) => review.isFollowing);

  const selectedCommentReview = reviews.find((review) => review.id === commentTargetReviewId) ?? null;

  const handleLike = (id: number) => {
    onToggleLike(id);
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

  const handleCopyShareLink = (reviewId: number) => {
    const shareUrl = `${window.location.origin}/feed/${reviewId}`;

    setCopiedReviewId(reviewId);
    window.setTimeout(() => setCopiedReviewId(null), 1600);
    void navigator.clipboard.writeText(shareUrl);
  };

  const handleSubmitComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCommentReview || !commentText.trim()) return;
    const nextCommentId = selectedCommentReview.commentsList.reduce((maxId, comment) => (
      Math.max(maxId, comment.id)
    ), selectedCommentReview.id * 100);

    const nextComment = {
      id: nextCommentId + 1,
      author: "나",
      avatarInitial: "나",
      avatarImage: currentProfile?.imgUrl,
      time: "방금 전",
      text: commentText.trim(),
      likes: 0,
      liked: false,
    };

    onAddComment(selectedCommentReview.id, nextComment);
    setCommentText("");
  };

  const handleSubmitReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMedia || newRating === 0 || !newReviewText.trim()) return;
    const nextReviewId = reviews.reduce((maxId, review) => Math.max(maxId, review.id), 0) + 1;

    const nextReview: FeedReview = {
      id: nextReviewId,
      author: "나",
      avatarInitial: "나",
      avatarImage: currentProfile?.imgUrl,
      isFollowing: false,
      time: "방금 전",
      mediaId: selectedMedia.id,
      mediaType: selectedMedia.mediaType,
      mediaTitle: selectedMedia.title,
      mediaPoster: selectedMedia.posterPath,
      mediaMeta: selectedMedia.meta,
      rating: newRating,
      reviewText: newReviewText.trim(),
      spoiler: newHasSpoiler,
      public: newIsPublic,
      likes: 0,
      comments: 0,
      liked: false,
      commentsList: [],
    };

    onAddReview(nextReview);
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
                <h3 id="feed-write-title">리뷰 작성</h3>
                <p>작품을 선택하고 커뮤니티에 공개할 리뷰를 남겨보세요.</p>
              </div>
              <button type="button" className="feed-modal-close" onClick={closeWriteModal} aria-label="리뷰 작성 닫기">
                ×
              </button>
            </div>

            <div className="feed-write-fields">
              <label className="feed-search-field">
                <span>작품 검색</span>
                <input
                  type="text"
                  value={reviewSearch}
                  onChange={(event) => setReviewSearch(event.target.value)}
                  placeholder="작품 제목을 입력해 주세요"
                />
              </label>

              <div className="feed-media-results">
                {filteredMediaOptions.map((item) => (
                  <button
                    type="button"
                    key={`${item.mediaType}-${item.id}`}
                    className={selectedMedia?.id === item.id && selectedMedia.mediaType === item.mediaType ? "selected" : ""}
                    onClick={() => setSelectedMedia(item)}
                  >
                    {item.posterPath && <img src={getPosterUrl(item.posterPath)} alt="" />}
                    <span>
                      <strong>{item.title}</strong>
                      <em>{item.meta}</em>
                    </span>
                  </button>
                ))}
              </div>

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
                          onClick={() => setNewRating(star)}
                          onDoubleClick={() => setNewRating(star - 0.5)}
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
                  {newIsPublic ? "커뮤니티 공개" : "비공개"}
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
                등록
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
                <div className="comment-item" key={comment.id}>
                  <div className="comment-avatar">
                    {comment.avatarImage ? <img src={comment.avatarImage} alt="" /> : comment.avatarInitial}
                  </div>
                  <div className="comment-content">
                    <div className="comment-meta">
                      <strong>{comment.author}</strong>
                      <span>{comment.time}</span>
                    </div>
                    <p>{comment.text}</p>
                    <button type="button">좋아요 {comment.likes}</button>
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
              등록
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
              const isReported = reportedReviewIds.includes(review.id);
              const shouldBlurSpoiler = review.spoiler && !visibleSpoilerReviewIds.includes(review.id);

              return (
                <article key={review.id} className="feed-post">
                  <div className="post-head">
                    <div className="post-avatar">
                      {review.avatarImage ? <img src={review.avatarImage} alt="" /> : review.avatarInitial}
                    </div>
                    <div className="post-meta">
                      <h3>{review.author}</h3>
                      <div className="post-info">
                        <span className="time">{review.time}</span>
                        {!review.public && <span className="private-tag">비공개</span>}
                      </div>
                    </div>
                    <div className="review-tags">
                      {review.spoiler && <span className="spoiler-tag">스포일러</span>}
                      <div className="report-menu">
                        <button
                          type="button"
                          className={isReported ? "report-btn active" : "report-btn"}
                          onClick={() => handleOpenReportReview(review.id)}
                          aria-pressed={isReported}
                        >
                          신고
                        </button>
                        {reportTargetReviewId === review.id && (
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
                    <Link href={`/detail/${review.mediaType}/${review.mediaId}`} className="thumb">
                      {review.mediaPoster && (
                        <img src={getPosterUrl(review.mediaPoster)} alt={review.mediaTitle} />
                      )}
                    </Link>
                    <div className="review-info">
                      <Link href={`/feed/${review.id}`} className="feed-detail-link">
                        <h4>{review.mediaTitle}</h4>
                        <p className="meta">{review.mediaMeta}</p>
                        <div className="stars">
                          {renderRatingStars(review.rating)}
                          <em>{review.rating.toFixed(1)} / 5.0</em>
                        </div>
                      </Link>
                      <div className={shouldBlurSpoiler ? "review-text-wrap spoiler-blurred" : "review-text-wrap"}>
                        <Link href={`/feed/${review.id}`} className="review-text-link">
                          <p className="review-text">{review.reviewText}</p>
                        </Link>
                        {shouldBlurSpoiler && (
                          <button
                            type="button"
                            className="spoiler-reveal-btn"
                            onClick={() => setVisibleSpoilerReviewIds((prev) => [...prev, review.id])}
                          >
                            스포일러 보기
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="post-actions">
                    <button
                      type="button"
                      className={`action ${review.liked ? "liked" : ""}`}
                      onClick={() => handleLike(review.id)}
                    >
                      {review.liked ? "♥" : "♡"} {review.likes}
                    </button>
                    <button type="button" className="action" onClick={() => setCommentTargetReviewId(review.id)}>
                      댓글 {review.comments}
                    </button>
                    <button
                      type="button"
                      className={copiedReviewId === review.id ? "action copied" : "action"}
                      onClick={() => handleCopyShareLink(review.id)}
                    >
                      {copiedReviewId === review.id ? "복사됨" : "공유"}
                    </button>
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
