"use client";

export type FeedTab = "all" | "following";
export type MediaType = "movie" | "tv";

export interface FeedComment {
  //id: number;
  id: string;
  author: string;
  avatarInitial: string;
  avatarImage?: string | null;
  isBestReviewer?: boolean;
  isMine?: boolean;
  time: string;
  text: string;
  likes: number;
  liked: boolean;

  //firebase연동
  authorUid?: string;
  authorProfileId?: number | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FeedReview {
  //id: number;
  id: string;
  author: string;
  avatarInitial: string;
  avatarImage?: string | null;
  isBestReviewer?: boolean;
  isMine?: boolean;
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

  //firebase연동
  authorUid?: string;
  authorProfileId?: number | null;
  createdAt?: unknown;
  updatedAt?: unknown;
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
    id: "seed-feed-1",
    author: "민서",
    avatarInitial: "민",
    isBestReviewer: true,
    isFollowing: true,
    time: "2시간 전",
    mediaId: 872585,
    mediaType: "movie",
    mediaTitle: "오펜하이머",
    mediaPoster: "/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    mediaMeta: "영화 · 2023 · 평균 8.1",
    rating: 4.5,
    reviewText:
      "러닝타임은 길지만 장면마다 긴장감이 높아서 끝까지 몰입됐어요. 인물의 선택을 보여주는 방식이 묵직했고, 마지막 사운드가 오래 남았습니다.",
    spoiler: false,
    public: true,
    likes: 132,
    comments: 3,
    liked: true,
    commentsList: [
      {
        id: "seed-comment-101",
        author: "수진",
        avatarInitial: "수",
        time: "1시간 전",
        text: "마지막 장면 여운이 진짜 오래 가더라.",
        likes: 12,
        liked: false,
      },
      {
        id: "seed-comment-102",
        author: "도윤",
        avatarInitial: "도",
        time: "48분 전",
        text: "사운드 좋은 관에서 다시 보고 싶었어.",
        likes: 6,
        liked: false,
      },
      {
        id: "seed-comment-103",
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
    id: "seed-feed-2",
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
    reviewText:
      "초반부의 선택 때문에 인물관계가 갈리는 지점이 인상적이었어요. 특정 인물의 퇴장 장면은 정말 충격적이었습니다.",
    spoiler: true,
    public: true,
    likes: 45,
    comments: 2,
    liked: false,
    commentsList: [
      {
        id: "seed-comment-201",
        author: "재현",
        avatarInitial: "재",
        time: "3시간 전",
        text: "스포일러 보기 누르고 읽었는데 공감합니다.",
        likes: 8,
        liked: false,
      },
      {
        id: "seed-comment-202",
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
    id: "seed-feed-3",
    author: "서연",
    avatarInitial: "서",
    isBestReviewer: true,
    isFollowing: false,
    time: "어제",
    mediaId: 313369,
    mediaType: "movie",
    mediaTitle: "라라랜드",
    mediaPoster: "/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
    mediaMeta: "영화 · 로맨스 · 평균 8.0",
    rating: 4.5,
    reviewText:
      "색감이랑 음악이 오래 남는 영화. 꿈을 좇는 마음과 현실 사이의 균형이 씁쓸해서 마지막 장면까지 계속 생각나요.",
    spoiler: false,
    public: true,
    likes: 89,
    comments: 2,
    liked: false,
    commentsList: [
      {
        id: "seed-comment-301",
        author: "현우",
        avatarInitial: "현",
        time: "어제",
        text: "음악 시작될 때마다 소름...",
        likes: 10,
        liked: false,
      },
      {
        id: "seed-comment-302",
        author: "나은",
        avatarInitial: "나",
        time: "어제",
        text: "재개봉하면 바로 보러 갈 영화.",
        likes: 5,
        liked: false,
      },
    ],
  },
  {
    id: "seed-feed-9001",
    author: "혜원",
    avatarInitial: "혜",
    // avatarImage: "/images/profile/image/default_icons/18.png",
    //isBestReviewer: true,
    isFollowing: true,
    time: "약 2시간 전",
    mediaId: 575265,
    mediaType: "movie",
    mediaTitle: "인터스텔라",
    mediaPoster: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    mediaMeta: "영화 · 미스터리 · 평균 8.5",
    rating: 4.5,
    reviewText:
      "그래비티가 어머니에 관한 영화였다면 인터스텔라는 아버지에 관한 영화다",
    spoiler: false,
    public: true,
    likes: 2,
    comments: 1,
    liked: false,
    commentsList: [
      {
        id: "seed-comment-900101",
        author: "지원",
        avatarInitial: "지",
        //avatarImage: "/images/profile/image/default_icons/18.png",
        isBestReviewer: true,
        time: "방금 전",
        text: "이런 결의 영화 좋아하면 꽤 재밌게 볼 수 있어요.",
        likes: 0,
        liked: false,
      },
    ],
  },
];

export const getPosterUrl = (path?: string) =>
  path ? `https://image.tmdb.org/t/p/w300${path}` : "";

const hydrateFeedReview = (review: FeedReview) => {
  const seedReview = INITIAL_REVIEWS.find((item) => item.id === review.id);
  const isMine =
    review.isMine ?? (review.author === "나" && review.avatarInitial === "나");
  const baseReview =
    seedReview && !isMine
      ? {
          ...seedReview,
          likes: review.likes ?? seedReview.likes,
          liked: review.liked ?? seedReview.liked,
          commentsList: seedReview.commentsList,
        }
      : review;
  const commentsList = (baseReview.commentsList ?? []).map((comment) => ({
    ...comment,
    isMine:
      comment.isMine ??
      (comment.author === "나" && comment.avatarInitial === "나"),
  }));

  return {
    ...baseReview,
    isMine,
    commentsList,
    comments: commentsList.length,
    id: String(baseReview.id),
  };
};

export const loadFeedReviews = () => {
  if (typeof window === "undefined") return INITIAL_REVIEWS;

  try {
    const storedReviews = window.localStorage.getItem(FEED_STORAGE_KEY);
    if (!storedReviews) return INITIAL_REVIEWS;

    const parsedReviews = (JSON.parse(storedReviews) as FeedReview[]).map(
      (review) => ({
        ...review,
        id: String(review.id),
        commentsList: (review.commentsList ?? []).map((comment) => ({
          ...comment,
          id: String(comment.id),
        })),
      }),
    );

    const storedReviewIds = new Set(parsedReviews.map((review) => review.id));
    const mergedReviews = [
      ...parsedReviews,
      ...INITIAL_REVIEWS.filter((review) => !storedReviewIds.has(review.id)),
    ];

    return mergedReviews.map(hydrateFeedReview);
  } catch {
    return INITIAL_REVIEWS;
  }
};

export const saveFeedReviews = (reviews: FeedReview[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(reviews));
};
