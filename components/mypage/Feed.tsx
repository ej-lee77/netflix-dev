"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type FeedView } from "@/store/useFeedStore";
import { getPosterUrl, getRelativeTime } from "@/types/feedData"; // 기존 유틸 함수 활용
import "../scss/feed.scss";

interface MyPageFeedProps {
  feeds: FeedView[];
  onDeleteFeed: (feedId: string) => void;
  onEditFeed: (review: FeedView) => void;
}

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

type ScopeFilterType = "mine" | "liked" | "following";
type SortType = "recent" | "likes" | "comments";

const scopeFilters: { key: ScopeFilterType; label: string }[] = [
  { key: "mine", label: "내가 쓴 글" },
  { key: "liked", label: "좋아요 한 글" },
  { key: "following", label: "팔로워 글" },
];

const sortOptions: { key: SortType; label: string }[] = [
  { key: "recent", label: "최근 작성순" },
  { key: "likes", label: "좋아요 많은순" },
  { key: "comments", label: "댓글 많은순" },
];

export default function MyPageFeed({ feeds, onDeleteFeed, onEditFeed }: MyPageFeedProps) {
  const [sortType, setSortType] = useState<SortType>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const currentSortLabel = sortOptions.find((o) => o.key === sortType)?.label;
  const [scopeFilter, setScopeFilter] = useState<ScopeFilterType>("mine");

  return (
    <>
    <div className="section-title-row">
      <h2>피드 관리</h2>
      <span className="total-count">
        {`${feeds.length}개`}
      </span>
    </div>

    {/* 4. 스크린샷 스타일의 서브 툴바 (타원형 칩 필터 + 우측 정렬) */}
    <div className="community-toolbar">
      <div className="community-chips">
        {scopeFilters.map((sf) => (
          <button
            type="button"
            key={sf.key}
            className={`chip ${scopeFilter === sf.key ? "is-active" : ""}`}
            onClick={() => setScopeFilter(sf.key)}
          >
            {sf.label} 
            {/* {sf.key === "mine" ? counts.mine : sf.key === "liked" ? counts.liked : sf.key === "following" ? counts.following : 0} */}
          </button>
        ))}
      </div>

      <div className="community-sort">
        <button type="button" className="sort-btn" onClick={() => setSortOpen(!sortOpen)}>
          {currentSortLabel}
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className={`sort-arrow ${sortOpen ? "is-open" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {sortOpen && (
          <ul className="sort-menu">
            {sortOptions
              // 1. 리뷰 탭일 때 "comments" 옵션 필터링
              .filter((opt) => !(opt.key === "comments"))
              .map((opt) => (
                <li key={opt.key}>
                  <button
                    type="button"
                    className={`sort-option ${sortType === opt.key ? "is-selected" : ""}`}
                    onClick={() => {
                      setSortType(opt.key);
                      setSortOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>

    <div className="feed-layout">
      <div className="feed-main">
        {feeds.length > 0 ? (
          feeds.map((review) => (
            <article key={review.feedId} className="feed-post">
              {/* 상세 페이지 이동 링크 */}
              <Link
                href={`/feed/${review.feedId}`}
                className="feed-card-link"
                aria-label={`${review.mediaTitle} 피드 상세 보기`}
              />

              <div className="post-head">
                <div className="post-meta">
                  <h3>{review.author}</h3>
                  <div className="post-info">
                    <span className="time">{getRelativeTime(review.createdAt)}</span>
                    {!review.isPublic && <span className="private-tag">비공개</span>}
                  </div>
                </div>
                <div className="review-tags">
                  {review.isSpoiler && <span className="spoiler-tag">스포일러</span>}
                </div>
              </div>

              <div className="post-body review-body">
                <Link
                  href={`/detail/${review.mediaType}/${review.mediaId}`}
                  className="thumb feed-card-layer"
                >
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
                  <div className="review-text-wrap">
                    <p className="review-text">{review.content}</p>
                  </div>
                </div>
              </div>

              {/* 마이페이지용 액션 버튼 (수정/삭제) */}
              <div className="post-actions feed-card-layer">
                <div className="action">♥ {review.likesCount}</div>
                <div className="action">댓글 {review.comments}</div>
                <div className="review-owner-actions">
                  <button
                    type="button"
                    className="action"
                    onClick={() => onEditFeed(review)}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="action delete-review-btn"
                    onClick={() => onDeleteFeed(review.feedId)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="community-empty">
            <p className="empty-text">작성한 게시물이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}