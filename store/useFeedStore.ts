import { create } from "zustand";
import {
  FeedComment,
  FeedReview,
  INITIAL_REVIEWS,
} from "@/app/feed/feedData";

import { db } from "@/firebase/firebase";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

interface FeedState {
  reviews: FeedReview[];
  onHydrateReviews: () => Promise<void>;
  onAddReview: (review: FeedReview) => Promise<void>;
  onUpdateReview: (review: FeedReview) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onAddComment: (reviewId: string, comment: FeedComment) => Promise<void>;
  onUpdateComment: (
    reviewId: string,
    commentId: string,
    text: string,
  ) => Promise<void>;
  onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
  onToggleLike: (reviewId: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  reviews: INITIAL_REVIEWS,

  onHydrateReviews: async () => {
    const snapshot = await getDocs(
      query(collection(db, "feeds"), orderBy("createdAt", "desc")),
    );

    const firestoreReviews = snapshot.docs.map((feedDoc) => ({
      id: feedDoc.id,
      ...feedDoc.data(),
      commentsList: [],
    })) as unknown as FeedReview[];
    const firestoreReviewIds = new Set(firestoreReviews.map((review) => review.id));
    const mergedReviews = [
      ...firestoreReviews,
      ...INITIAL_REVIEWS.filter((review) => !firestoreReviewIds.has(review.id)),
    ];

    const nextReviews = await Promise.all(
      mergedReviews.map(async (review) => {
        const commentsSnapshot = await getDocs(
          query(
            collection(db, "feeds", review.id, "comments"),
            orderBy("createdAt", "desc"),
          ),
        );

        const firestoreComments = commentsSnapshot.docs.map((commentDoc) => ({
          id: commentDoc.id,
          ...commentDoc.data(),
        })) as FeedComment[];
        const firestoreCommentIds = new Set(firestoreComments.map((comment) => comment.id));
        const seedComments = review.commentsList.filter((comment) => !firestoreCommentIds.has(comment.id));
        const commentsList = [...firestoreComments, ...seedComments];

        return {
          ...review,
          comments: commentsList.length,
          commentsList,
        };
      }),
    );

    set({ reviews: nextReviews });
  },

  onAddReview: async (review) => {
    const { id, commentsList, isMine, ...payload } = review;
    void id;
    void commentsList;
    void isMine;

    const docRef = await addDoc(collection(db, "feeds"), {
      ...payload,
      likes: 0,
      liked: false,
      comments: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    set((state) => ({
      reviews: [
        { ...review, id: docRef.id, commentsList: [] },
        ...state.reviews,
      ],
    }));
  },

  onUpdateReview: async (review) => {
    const { id, commentsList, comments, isMine, ...payload } = review;
    void commentsList;
    void comments;
    void isMine;

    await updateDoc(doc(db, "feeds", id), {
      ...payload,
      updatedAt: serverTimestamp(),
    });

    set((state) => ({
      reviews: state.reviews.map((item) => (item.id === id ? review : item)),
    }));
  },

  onDeleteReview: async (reviewId) => {
    await deleteDoc(doc(db, "feeds", reviewId));

    set((state) => ({
      reviews: state.reviews.filter((review) => review.id !== reviewId),
    }));
  },

  onAddComment: async (reviewId, comment) => {
    const { id, isMine, ...payload } = comment;
    void id;
    void isMine;

    const docRef = await addDoc(collection(db, "feeds", reviewId, "comments"), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const nextComment = { ...comment, id: docRef.id };

    set((state) => ({
      reviews: state.reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              comments: review.comments + 1,
              commentsList: [nextComment, ...review.commentsList],
            }
          : review,
      ),
    }));
  },

  onUpdateComment: async (reviewId, commentId, text) => {
    await updateDoc(doc(db, "feeds", reviewId, "comments", commentId), {
      text,
      time: "방금 수정됨",
      updatedAt: serverTimestamp(),
    });

    set((state) => ({
      reviews: state.reviews.map((review) => {
        if (review.id !== reviewId) return review;

        return {
          ...review,
          commentsList: review.commentsList.map((comment) =>
            comment.id === commentId
              ? { ...comment, text, time: "방금 수정됨" }
              : comment,
          ),
        };
      }),
    }));
  },

  onDeleteComment: async (reviewId, commentId) => {
    await deleteDoc(doc(db, "feeds", reviewId, "comments", commentId));

    set((state) => ({
      reviews: state.reviews.map((review) => {
        if (review.id !== reviewId) return review;

        const nextCommentsList = review.commentsList.filter(
          (comment) => comment.id !== commentId,
        );

        return {
          ...review,
          comments: nextCommentsList.length,
          commentsList: nextCommentsList,
        };
      }),
    }));
  },

  onToggleLike: async (reviewId) => {
    const targetReview = get().reviews.find((review) => review.id === reviewId);
    if (!targetReview) return;

    const nextLiked = !targetReview.liked;
    const nextLikes = targetReview.liked
      ? Math.max(0, targetReview.likes - 1)
      : targetReview.likes + 1;

    await updateDoc(doc(db, "feeds", reviewId), {
      liked: nextLiked,
      likes: nextLikes,
      updatedAt: serverTimestamp(),
    });

    set((state) => ({
      reviews: state.reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              liked: nextLiked,
              likes: nextLikes,
            }
          : review,
      ),
    }));
  },
}));
