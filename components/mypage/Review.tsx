import React, { useEffect, useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import "../scss/review.scss"; // SCSS 파일 임포트

export default function Review() {
  const { reviews, fetchUserReviews, addReview } = useCommunityStore();
  
  const [reviewText, setReviewText] = useState("");
  const [reviewHasSpoiler, setReviewHasSpoiler] = useState(false);
  
  useEffect(() => {
    fetchUserReviews(); 
  }, [fetchUserReviews]);

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
      <div className="review-list">
        {reviews.map((review) => (
          <article key={review.reviewId} className="review-item">
            <p className="review-content">{review.content}</p>
            {review.isSpoiler && <small className="spoiler-tag">[스포일러]</small>}
          </article>
        ))}
      </div>
    </div>
  );
}