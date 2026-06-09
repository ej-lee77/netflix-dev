"use client";

import React, { useState } from "react";
import Link from "next/link";
import FeedReviewCard from "@/components/feed/FeedReviewCard";
import { type FeedView } from "@/store/useFeedStore";

interface MyPageFeedProps {
  feeds: FeedView[];
  sortType: "recent" | "likes" | "comments";
  scopeFilter: "mine" | "liked" | "following";
  onDeleteFeed: (feedId: string) => void;
  onEditFeed: (review: FeedView) => void;
}

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

export default function MyPageFeed({
  feeds,
  sortType,
  scopeFilter,
  onDeleteFeed,
  onEditFeed,
}: MyPageFeedProps) {
  const sortedFeeds = sortFeeds(feeds, sortType);

  if (sortedFeeds.length === 0) {
    return (
      <div className="community-empty">
        <p className="empty-text">{getEmptyMessage(scopeFilter)}</p>
      </div>
    );
  }

  return (
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
  );
}
