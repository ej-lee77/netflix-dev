"use client";

export type FeedTab = "all" | "following";
export type MediaType = "movie" | "tv";

export interface FeedComment {
  id: number;
  author: string;
  avatarInitial: string;
  avatarImage?: string | null;
  time: string;
  text: string;
  likes: number;
  liked: boolean;
}

export interface FeedReview {
  id: number;
  author: string;
  avatarInitial: string;
  avatarImage?: string | null;
  isFollowing: boolean;
  time: string;
  mediaId: number;
  mediaType: MediaType;
  mediaTitle: string;
  mediaPoster?: string;
  mediaMeta: string;
  rating: number;
  reviewText: string;
  spoiler: boolean;
  public: boolean;
  likes: number;
  comments: number;
  liked: boolean;
  commentsList: FeedComment[];
}

export interface FeedMediaOption {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string;
  meta: string;
}

export const FEED_STORAGE_KEY = "netflix-feed-reviews";

export const REPORT_REASONS = [
  "내용이 부적절해요",
  "스포일러가 포함되어 있어요",
  "욕설 또는 혐오 표현이에요",
  "광고나 홍보예요",
  "기타",
];

export const INITIAL_REVIEWS: FeedReview[] = [
  {
    id: 1,
    author: "민서",
    avatarInitial: "민",
    isFollowing: true,
    time: "2시간 전",
    mediaId: 872585,
    mediaType: "movie",
    mediaTitle: "오펜하이머",
    mediaPoster: "/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    mediaMeta: "영화 · 2023 · 평균 8.1",
    rating: 4.5,
    reviewText: "러닝타임은 길지만 장면마다 긴장감이 높아서 끝까지 몰입됐어요. 인물의 선택을 보여주는 방식이 묵직했고, 마지막 사운드가 오래 남았습니다.",
    spoiler: false,
    public: true,
    likes: 132,
    comments: 3,
    liked: true,
    commentsList: [
      {
        id: 101,
        author: "수진",
        avatarInitial: "수",
        time: "1시간 전",
        text: "마지막 장면 여운이 진짜 오래 가더라.",
        likes: 12,
        liked: false,
      },
      {
        id: 102,
        author: "도윤",
        avatarInitial: "도",
        time: "48분 전",
        text: "사운드 좋은 관에서 다시 보고 싶었어.",
        likes: 6,
        liked: false,
      },
      {
        id: 103,
        author: "하린",
        avatarInitial: "하",
        time: "32분 전",
        text: "긴 영화인데도 후반부 집중력이 대단했음.",
        likes: 4,
        liked: false,
      },
    ],
  },
  {
    id: 2,
    author: "지아",
    avatarInitial: "지",
    isFollowing: true,
    time: "5시간 전",
    mediaId: 1399,
    mediaType: "tv",
    mediaTitle: "왕좌의 게임",
    mediaPoster: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    mediaMeta: "시리즈 · 판타지 · 평균 8.4",
    rating: 4,
    reviewText: "초반부의 선택 때문에 인물관계가 갈리는 지점이 인상적이었어요. 특정 인물의 퇴장 장면은 정말 충격적이었습니다.",
    spoiler: true,
    public: true,
    likes: 45,
    comments: 2,
    liked: false,
    commentsList: [
      {
        id: 201,
        author: "재현",
        avatarInitial: "재",
        time: "3시간 전",
        text: "스포일러 보기 누르고 읽었는데 공감합니다.",
        likes: 8,
        liked: false,
      },
      {
        id: 202,
        author: "유나",
        avatarInitial: "유",
        time: "2시간 전",
        text: "초반 정치극 분위기가 제일 좋았어요.",
        likes: 3,
        liked: false,
      },
    ],
  },
  {
    id: 3,
    author: "서연",
    avatarInitial: "서",
    isFollowing: false,
    time: "어제",
    mediaId: 157336,
    mediaType: "movie",
    mediaTitle: "인터스텔라",
    mediaPoster: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    mediaMeta: "영화 · SF · 평균 8.5",
    rating: 5,
    reviewText: "큰 화면으로 다시 보고 싶어지는 작품. 과학적 상상력보다 가족 이야기가 더 크게 다가와서 좋았고 음악의 감정선도 거의 완벽합니다.",
    spoiler: false,
    public: true,
    likes: 89,
    comments: 2,
    liked: false,
    commentsList: [
      {
        id: 301,
        author: "현우",
        avatarInitial: "현",
        time: "어제",
        text: "음악 시작될 때마다 소름...",
        likes: 10,
        liked: false,
      },
      {
        id: 302,
        author: "나은",
        avatarInitial: "나",
        time: "어제",
        text: "재개봉하면 바로 보러 갈 영화.",
        likes: 5,
        liked: false,
      },
    ],
  },
];

export const getPosterUrl = (path?: string) => (
  path ? `https://image.tmdb.org/t/p/w300${path}` : ""
);

export const loadFeedReviews = () => {
  if (typeof window === "undefined") return INITIAL_REVIEWS;

  try {
    const storedReviews = window.localStorage.getItem(FEED_STORAGE_KEY);
    if (!storedReviews) return INITIAL_REVIEWS;

    const parsedReviews = JSON.parse(storedReviews) as FeedReview[];
    return parsedReviews.map((review) => ({
      ...review,
      commentsList: review.commentsList ?? [],
      comments: review.commentsList?.length ?? review.comments ?? 0,
    }));
  } catch {
    return INITIAL_REVIEWS;
  }
};

export const saveFeedReviews = (reviews: FeedReview[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(reviews));
};
