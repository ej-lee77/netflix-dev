import React, { useEffect, useState } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';

export default function Review({ videoId }: { videoId: string }) {
  // 스토어에서 상태와 액션을 가져옵니다. (profileId는 스토어 내부에서 처리됨)
  const { reviews, fetchUserReviews, addReview } = useCommunityStore();
  
  const [reviewText, setReviewText] = useState("");
  const [reviewHasSpoiler, setReviewHasSpoiler] = useState(false);

  // 마운트 시 데이터 로드
  useEffect(() => {
    fetchUserReviews(); 
  }, [fetchUserReviews]);

  // 리뷰 작성
  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return;

    await addReview({
      content: reviewText.trim(),
      videoId, // videoId만 넘겨주면 됩니다.
      likesCount: 0,
      isSpoiler: reviewHasSpoiler,
      reportsCount: 0,
      isDelete: false
    });

    setReviewText("");
    setReviewHasSpoiler(false);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 작성 섹션 */}
      <textarea 
        value={reviewText} 
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="감상을 남겨보세요"
      />
      <label>
        <input 
          type="checkbox" 
          checked={reviewHasSpoiler} 
          onChange={(e) => setReviewHasSpoiler(e.target.checked)} 
        />
        스포일러
      </label>
      <button onClick={handleSubmitReview}>등록</button>

      {/* 목록 섹션 */}
      <div>
        {reviews.map((review) => (
          <div key={review.reviewId} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
            <p>{review.content}</p>
            {review.isSpoiler && <small style={{ color: 'red' }}>[스포일러]</small>}
          </div>
        ))}
      </div>
    </div>
  );
}