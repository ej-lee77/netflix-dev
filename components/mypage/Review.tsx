"use client";

import Link from "next/link";
import { type ReviewDocument } from "@/types/community";
import "../scss/review.scss";

interface ReviewProps {
  reviews: ReviewDocument[];
  sortType: "recent" | "likes" | "comments";
  scopeFilter: "mine" | "liked" | "following";
}

const renderStars = (rating: number) => {
  const roundedRating = Math.round(rating);
  const fullStars = "★".repeat(roundedRating);
  const emptyStars = "☆".repeat(5 - roundedRating);

  return fullStars + emptyStars;
};

const getEmptyMessage = (scopeFilter: ReviewProps["scopeFilter"]) => {
  switch (scopeFilter) {
    case "liked":
      return "좋아요한 리뷰가 없습니다.";
    case "following":
      return "팔로잉한 사용자의 리뷰가 없습니다.";
    case "mine":
    default:
      return "작성한 리뷰가 없습니다.";
  }
};

const getDetailHref = (videoId: string) => {
  const [linkType, linkId] = videoId.split("-");

  return `/detail/${linkType || "movie"}/${linkId || videoId}`;
};

const sortReviews = (reviews: ReviewDocument[], sortType: ReviewProps["sortType"]) =>
  [...reviews].sort((a, b) => {
    switch (sortType) {
      case "likes":
        return (b.likesCount || 0) - (a.likesCount || 0);
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

export default function Review({ reviews, sortType, scopeFilter }: ReviewProps) {
  const sortedReviews = sortReviews(reviews, sortType);

  if (sortedReviews.length === 0) {
    return (
      <div className="community-empty">
        <p className="empty-text">{getEmptyMessage(scopeFilter)}</p>
      </div>
    );
  }

  return (
    <div className="review-container">
      <div className="review-list">
        {sortedReviews.map((review) => (
          <Link
            key={`${review.videoId}-${review.reviewId}`}
            href={getDetailHref(review.videoId)}
            className="review-card-link"
          >
            <article className="review-item">
              <div className="review-item__head">
                <div>
                  <strong>{review.nickname}</strong>
                  <span className="review-stars">{renderStars(review.rating)}</span>
                  <span className="review-score">{review.rating.toFixed(1)} / 5.0</span>
                </div>
                {review.isSpoiler && <span className="spoiler-tag">스포일러</span>}
              </div>

              <p className="review-content">{review.content}</p>

              <div className="review-item__foot">
                <time>{new Date(review.createdAt).toLocaleDateString("ko-KR")}</time>
                <span>좋아요 {review.likesCount}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
