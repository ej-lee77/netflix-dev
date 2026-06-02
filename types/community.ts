// 리뷰 타입
export interface ReviewDocument {
  reviewId: string;         // 리뷰 고유 ID
  content: string;          // 리뷰 내용
  videoId: string;          // 영상 아이디
  likesCount: number;       // 좋아요 수
  dislikesCount: number;    // 싫어요 수
  isSpoiler: boolean;       // 스포일러 여부
  reportsCount: number;     // 신고 횟수
  createdAt: string;
  isDelete: boolean;

  // 파이어베이스 연동 및 관리를 위한 필수 확장 필드
  userId: string;           // 리뷰 작성자 ID
}

// 1. 댓글 인터페이스 (Sub-collection용)
export interface FeedComment {
  commentId: string;        // 댓글 아이디
  userId: string;           // 유저 아이디
  content: string;          // 댓글 내용
  reportsCount: number;     // 신고
  likesCount: number;       // 좋아요
}

// 2. 피드 메인 문서 인터페이스 (Main-collection용)
export interface FeedDocument {
  feedId: string;           // 피드 아이디 (Document ID)
  userId: string;           // 유저 아이디
  videoId: string;          // 영상 아이디
  content: string;          // 피드 내용
  likesCount: number;       // 좋아요
  reportsCount: number;     // 신고
  comments: FeedComment;    // 댓글
}

export interface ReviewStore {
  reviews: ReviewDocument[];
  movieMap: Record<string, any>;
  fetchUserReviews: (userId: string) => Promise<void>;
}