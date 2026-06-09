"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BackButton from "@/components/common/BackButton";
import Feed from "@/components/mypage/Feed";
import Review from "@/components/mypage/Review";
import { useAuthStore } from "@/store/useAuthStore";
import { useCommunityStore } from "@/store/useCommunityStore";
import { type FeedView, useFeedStore } from "@/store/useFeedStore";
import { type ReviewDocument } from "@/types/community";
import "../../scss/feed.scss";
import "../../scss/communityPage.scss";

type CommunityTab = "reviews" | "my-feeds";
type ScopeFilterType = "mine" | "liked" | "following";
type SortType = "recent" | "likes" | "comments";

const tabs: { id: CommunityTab; label: string }[] = [
  { id: "reviews", label: "리뷰 관리" },
  { id: "my-feeds", label: "피드 관리" },
];

const scopeFilters: { key: ScopeFilterType; label: string }[] = [
  { key: "mine", label: "내가 쓴 글" },
  { key: "liked", label: "좋아요한 글" },
  { key: "following", label: "팔로워 글" },
];

const sortOptions: { key: SortType; label: string }[] = [
  { key: "recent", label: "최근 작성순" },
  { key: "likes", label: "좋아요 많은순" },
  { key: "comments", label: "댓글 많은순" },
];

const getUserId = (user: ReturnType<typeof useAuthStore.getState>["user"]) =>
  user?.userId || (user as { uid?: string } | null)?.uid || "";

const getReviewKey = (review: ReviewDocument) => `${review.videoId}#${review.reviewId}`;

export default function CommunityPage() {
  return (
    <Suspense fallback={null}>
      <CommunityContent />
    </Suspense>
  );
}

function CommunityContent() {
  const { user, currentProfile } = useAuthStore();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<CommunityTab>(
    initialTab === "my-feeds" || initialTab === "reviews" ? initialTab : "reviews",
  );
  const [scopeFilter, setScopeFilter] = useState<ScopeFilterType>("mine");
  const [sortType, setSortType] = useState<SortType>("recent");
  const [sortOpen, setSortOpen] = useState(false);

  const { reviews, fetchAllReviews } = useCommunityStore();
  const { feeds, onDeleteFeed, onHydrateFeeds } = useFeedStore();

  const currentUserId = getUserId(user);
  const likedReviewKeys = currentProfile?.community?.reviews ?? [];
  const likedFeedIds = currentProfile?.community?.likedfeeds ?? [];
  const followingIds = currentProfile?.community?.following ?? [];

  useEffect(() => {
    if (!user) return;

    void fetchAllReviews();
    void onHydrateFeeds();
  }, [fetchAllReviews, onHydrateFeeds, user]);

  const visibleReviews = reviews.filter((review) => (review.reportsCount ?? 0) <= 5);
  const reviewBuckets = {
    mine: visibleReviews.filter(
      (review) =>
        review.userId === currentUserId &&
        (!currentProfile?.id || review.profileId === currentProfile.id),
    ),
    liked: visibleReviews.filter((review) => likedReviewKeys.includes(getReviewKey(review))),
    following: visibleReviews.filter((review) => Boolean(review.userId && followingIds.includes(review.userId))),
  };

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

  const filteredReviews = reviewBuckets[scopeFilter];
  const filteredFeeds = feedBuckets[scopeFilter];
  const currentTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || "커뮤니티 관리";
  const currentSortLabel = sortOptions.find((option) => option.key === sortType)?.label;
  const activeCount = activeTab === "reviews" ? filteredReviews.length : filteredFeeds.length;

  const handleEdit = (review: FeedView) => {
    console.log("수정할 피드:", review);
  };

  const handleDelete = (feedId: string) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      void onDeleteFeed(feedId);
    }
  };

  return (
    <div className="media-list-page community-page feed-page">
      <div className="community-inner">
        <BackButton fallback="/mypage" />

        <div className="community-header">
          <h1>커뮤니티 관리</h1>
        </div>

        <div className="community-tabs" aria-label="커뮤니티 메뉴">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setScopeFilter("mine");
                setSortType("recent");
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!user ? (
          <div className="community-empty">
            <p className="empty-text">로그인이 필요한 페이지입니다.</p>
            <Link href="/login" className="empty-cta">
              로그인하기
            </Link>
          </div>
        ) : (
          <div className="tab-content-panel">
            <div className="section-title-row">
              <h2>{currentTabLabel}</h2>
              <span className="total-count">{activeCount}개</span>
            </div>

            <div className="community-toolbar">
              <div className="community-chips">
                {scopeFilters.map((scope) => {
                  const count =
                    activeTab === "reviews"
                      ? reviewBuckets[scope.key].length
                      : feedBuckets[scope.key].length;

                  return (
                    <button
                      type="button"
                      key={scope.key}
                      className={`chip ${scopeFilter === scope.key ? "is-active" : ""}`}
                      onClick={() => setScopeFilter(scope.key)}
                    >
                      {scope.label} {count}
                    </button>
                  );
                })}
              </div>

              <div className="community-sort">
                <button type="button" className="sort-btn" onClick={() => setSortOpen((open) => !open)}>
                  {currentSortLabel}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className={`sort-arrow ${sortOpen ? "is-open" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {sortOpen && (
                  <ul className="sort-menu">
                    {sortOptions
                      .filter((option) => !(activeTab === "reviews" && option.key === "comments"))
                      .map((option) => (
                        <li key={option.key}>
                          <button
                            type="button"
                            className={`sort-option ${sortType === option.key ? "is-selected" : ""}`}
                            onClick={() => {
                              setSortType(option.key);
                              setSortOpen(false);
                            }}
                          >
                            {option.label}
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="main-content-area">
              {activeTab === "reviews" && (
                <Review reviews={filteredReviews} sortType={sortType} scopeFilter={scopeFilter} />
              )}

              {activeTab === "my-feeds" && (
                <Feed
                  feeds={filteredFeeds}
                  sortType={sortType}
                  scopeFilter={scopeFilter}
                  onDeleteFeed={handleDelete}
                  onEditFeed={handleEdit}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
