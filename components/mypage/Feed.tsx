"use client";

import React, { useState } from "react";
import Link from "next/link";
import FeedReviewCard from "@/components/feed/FeedReviewCard";
import { type FeedView } from "@/store/useFeedStore";
import { useAuthStore } from "@/store/useAuthStore";

interface MyPageFeedProps {
  feeds: FeedView[];
  sortType: "recent" | "likes" | "comments";
  scopeFilter: "mine" | "liked" | "following";
  onDeleteFeed: (feedId: string) => void;
  onEditFeed: (review: FeedView) => void;
}
type ScopeFilterType = "mine" | "liked" | "following";
type SortType = "recent" | "likes" | "comments";

const sortFeeds = (feeds: FeedView[], sortType: MyPageFeedProps["sortType"]) =>
  [...feeds].sort((a, b) => {
    switch (sortType) {
      case "likes":
        return (b.likesCount || 0) - (a.likesCount || 0);
      case "comments":
        return (b.comments || 0) - (a.comments || 0);
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

const getEmptyMessage = (scopeFilter: MyPageFeedProps["scopeFilter"]) => {
  switch (scopeFilter) {
    case "liked":
      return "좋아요한 피드가 없습니다.";
    case "following":
      return "팔로잉한 사용자의 피드가 없습니다.";
    case "mine":
    default:
      return "작성한 피드가 없습니다.";
  }
};

const sortOptions: { key: SortType; label: string }[] = [
  { key: "recent", label: "최근 작성순" },
  { key: "likes", label: "좋아요 많은순" },
  { key: "comments", label: "댓글 많은순" },
];

const scopeFilters: { key: ScopeFilterType; label: string }[] = [
  { key: "mine", label: "내가 쓴 글" },
  { key: "liked", label: "좋아요 한 글" },
  { key: "following", label: "팔로우 글" },
];

const getUserId = (user: ReturnType<typeof useAuthStore.getState>["user"]) =>
  user?.userId || (user as { uid?: string } | null)?.uid || "";

export default function MyPageFeed({
  feeds,
  onDeleteFeed,
  onEditFeed,
}: MyPageFeedProps) {
  const { user, currentProfile } = useAuthStore();
  const currentUserId = getUserId(user);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilterType>("mine");
  const [sortType, setSortType] = useState<SortType>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const currentSortLabel = sortOptions.find((o) => o.key === sortType)?.label;
  const likedFeedIds = currentProfile?.community?.likedfeeds ?? [];
  const followingIds = currentProfile?.community?.following ?? [];

  const feedBuckets = {
    mine: feeds.filter(
      (feed) =>
        feed.userId === currentUserId &&
        (!currentProfile?.id || feed.profileId === currentProfile.id),
    ),
    liked: feeds.filter(
      (feed) =>
        likedFeedIds.includes(feed.feedId) ||
        feed.liked ||
        feed.likedUserIds.includes(`${currentUserId}:${currentProfile?.id}`),
    ),
    following: feeds.filter((feed) => Boolean(feed.userId && followingIds.includes(feed.userId))),
  };

  const filteredFeeds = feedBuckets[scopeFilter];
  const sortedFeeds = sortFeeds(filteredFeeds, sortType);

  return (
    <>
    <div className="section-title-row">
      <h2>피드 관리</h2>
      <span className="total-count">
        {/* {`${enrichedReviews.length}개`} */}
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
    {sortedFeeds.length === 0 ? (
      <div className="community-empty">
        <p className="empty-text">{getEmptyMessage(scopeFilter)}</p>
      </div>
    ):(
    <div className="mypage-feed-list">
      {sortedFeeds.map((review) => (
        <FeedReviewCard
          key={review.feedId}
          review={review}
          showOwnerActions={scopeFilter === "mine"}
          onDelete={onDeleteFeed}
          onEdit={onEditFeed}
        />
      ))}
    </div>
    )}
    </>
  );
}
