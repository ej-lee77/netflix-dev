import { create } from "zustand";
import { FeedComment, FeedReview, INITIAL_REVIEWS, loadFeedReviews, saveFeedReviews } from "@/app/feed/feedData";

interface FeedState {
  reviews: FeedReview[];
  onHydrateReviews: () => void;
  onAddReview: (review: FeedReview) => void;
  onUpdateReview: (review: FeedReview) => void;
  onDeleteReview: (reviewId: number) => void;
  onAddComment: (reviewId: number, comment: FeedComment) => void;
  onUpdateComment: (reviewId: number, commentId: number, text: string) => void;
  onDeleteComment: (reviewId: number, commentId: number) => void;
  onToggleLike: (reviewId: number) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  reviews: INITIAL_REVIEWS,

  onHydrateReviews: () => {
    set({ reviews: loadFeedReviews() });
  },

  onAddReview: (review) => {
    const nextReviews = [review, ...get().reviews];
    saveFeedReviews(nextReviews);
    set({ reviews: nextReviews });
  },

  onUpdateReview: (review) => {
    const nextReviews = get().reviews.map((item) => (
      item.id === review.id ? review : item
    ));

    saveFeedReviews(nextReviews);
    set({ reviews: nextReviews });
  },

  onDeleteReview: (reviewId) => {
    const nextReviews = get().reviews.filter((review) => review.id !== reviewId);

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

  onUpdateComment: (reviewId, commentId, text) => {
    const nextReviews = get().reviews.map((review) => {
      if (review.id !== reviewId) return review;

      return {
        ...review,
        commentsList: review.commentsList.map((comment) => (
          comment.id === commentId
            ? { ...comment, text, time: "방금 수정됨" }
            : comment
        )),
      };
    });

    saveFeedReviews(nextReviews);
    set({ reviews: nextReviews });
  },

  onDeleteComment: (reviewId, commentId) => {
    const nextReviews = get().reviews.map((review) => {
      if (review.id !== reviewId) return review;

      const nextCommentsList = review.commentsList.filter((comment) => comment.id !== commentId);

      return {
        ...review,
        comments: nextCommentsList.length,
        commentsList: nextCommentsList,
      };
    });

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
