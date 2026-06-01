import { create } from "zustand";
import { FeedComment, FeedReview, loadFeedReviews, saveFeedReviews } from "@/app/feed/feedData";

interface FeedState {
  reviews: FeedReview[];
  onAddReview: (review: FeedReview) => void;
  onAddComment: (reviewId: number, comment: FeedComment) => void;
  onToggleLike: (reviewId: number) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  reviews: loadFeedReviews(),

  onAddReview: (review) => {
    const nextReviews = [review, ...get().reviews];
    saveFeedReviews(nextReviews);
    set({ reviews: nextReviews });
  },

  onAddComment: (reviewId, comment) => {
    const nextReviews = get().reviews.map((review) => (
      review.id === reviewId
        ? {
          ...review,
          comments: review.comments + 1,
          commentsList: [comment, ...review.commentsList],
        }
        : review
    ));

    saveFeedReviews(nextReviews);
    set({ reviews: nextReviews });
  },

  onToggleLike: (reviewId) => {
    const nextReviews = get().reviews.map((review) => (
      review.id === reviewId
        ? {
          ...review,
          liked: !review.liked,
          likes: review.liked ? review.likes - 1 : review.likes + 1,
        }
        : review
    ));

    saveFeedReviews(nextReviews);
    set({ reviews: nextReviews });
  },
}));
