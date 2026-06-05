import React, { useEffect, useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import "../scss/review.scss"; // SCSS 파일 임포트
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

const REVIEW_PAGE_SIZE = 10;

// 별점을 계산해서 렌더링하는 컴포넌트 내부 함수
const renderStars = (rating: number) => {
  const roundedRating = Math.round(rating); // 반올림하여 정수 별 개수 계산
  const fullStars = '★'.repeat(roundedRating);
  const emptyStars = '☆'.repeat(5 - roundedRating);
  
  return fullStars + emptyStars;
};

interface ReviewProps {
  sortType: "recent" | "likes" | "comments";
  scopeFilter: "mine" | "liked" | "following";
}

export default function Review({ sortType, scopeFilter }: ReviewProps) {
  const { reviews, fetchUserReviews } = useCommunityStore();
  const { currentProfile } = useAuthStore();
  const [reviewPage, setReviewPage] = useState(1);

  // 1. 기본 필터링 (신고 수)
  let processedReviews = reviews.filter((r) => (r.reportsCount ?? 0) <= 5);

  // 2. Scope 필터링 로직
  if (currentProfile) {
    processedReviews = processedReviews.filter((review) => {
      switch (scopeFilter) {
        case "mine":
          // 작성자 ID가 현재 프로필 ID와 일치
          return review.profileId === currentProfile.id;
        case "liked":
          // likedReviewKeys(videoId#reviewId)에 포함되는지 확인
          const reviewKey = `${review.videoId}#${review.reviewId}`;
          return currentProfile.community.reviews.includes(reviewKey);
        case "following":
          // 팔로잉한 유저의 리뷰인지 확인 (예: 팔로잉 리스트에 작성자 ID가 있는지)
          // return currentProfile.community.followingIds.includes(review.profileId);
        default:
          return true;
      }
    });
  }
  // 2. 정렬 로직 (이 부분이 추가되었습니다)
  processedReviews = [...processedReviews].sort((a, b) => {
    switch (sortType) {
      case "likes":
        return (b.likesCount || 0) - (a.likesCount || 0); // 좋아요 많은 순
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // 최근 작성순
    }
  });

  // 3. 페이지네이션 계산
  const totalReviewPages = Math.ceil(processedReviews.length / REVIEW_PAGE_SIZE);
  const pagedReviews = processedReviews.slice(
    (reviewPage - 1) * REVIEW_PAGE_SIZE,
    reviewPage * REVIEW_PAGE_SIZE
  );

  // const handleSubmitReview = async () => {
  //   if (!reviewText.trim()) return;

  //   await addReview({
  //     content: reviewText.trim(),
  //     videoId: "", 
  //     isSpoiler: reviewHasSpoiler,
  //     videoId: "",
  //   });

  //   setReviewText("");
  //   setReviewHasSpoiler(false);
  // };

  return (
    <div className="review-container">
      {reviews.length > 0 ? (<>
      
        {/* 작성 섹션 */}
        {/* <section className="write-section">
          <textarea 
            className="review-textarea"
            value={reviewText} 
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="감상을 남겨보세요"
          />
          <label className="spoiler-label">
            <input 
              type="checkbox" 
              checked={reviewHasSpoiler} 
              onChange={(e) => setReviewHasSpoiler(e.target.checked)} 
            />
            스포일러
          </label>
          <button className="submit-button" onClick={handleSubmitReview}>등록</button>
        </section> */}

        {/* 목록 섹션 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pagedReviews.map((review) => {
            const itemKeys = currentProfile?.community.reviews.map((key) => key.split('#')[0]);
            const isLiked = itemKeys?.includes(review.videoId);
            const shouldBlurSpoiler = review.isSpoiler;
            const [linkType, linkId] = review.videoId.split('-');

            return (
              <Link href={`/detail/${linkType}/${linkId}`}>
              <article
                key={review.reviewId}
                style={{
                  border: "1px solid #2a2a35",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.025)",
                  padding: 18,
                }}
              >
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                  <div>
                    <strong style={{ color: "#fff", fontSize: 15 }}>{review.nickname}</strong>
                    <span style={{ color: "#e50914", marginLeft: 10, fontSize: 13 }}>{renderStars(review.rating)}</span>
                    <span style={{ color: "#aaa", marginLeft: 8, fontSize: 12 }}>{review.rating.toFixed(1)} / 5.0</span>
                    {review.isSpoiler && (
                      <span style={{ marginLeft: 8, padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(229,9,20,0.45)", color: "#e50914", fontSize: 11 }}>
                        스포일러
                      </span>
                    )}
                  </div>
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
                    <p style={{ margin: 0, color: "#cfcfcf", lineHeight: 1.7, fontSize: 14 }}>
                      {review.content}
                    </p>
                  </div>
                </div>

                <time style={{ display: "block", marginTop: 12, color: "#666", fontSize: 12 }}>
                  {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                </time>
                <span
                    className="detail-secondary"
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
                      src={isLiked ? "/images/detail/review/heart-filled.svg" : "/images/detail/review/heart-lined.svg"}
                      alt="좋아요"
                      style={{ width: 14, height: 14, opacity: isLiked ? 1 : 0.86, filter: isLiked ? "none" : "invert(1)" }}
                    />
                    좋아요 {review.likesCount}
                  </span>
              </article>
              </Link>
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
      </>):
        <div className="community-empty">
          <p className="empty-text">작성된 리뷰가 없습니다.</p>
        </div>
      }
    </div>
  );
}