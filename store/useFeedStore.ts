import { auth, db } from "@/firebase/firebase";
import {
  FeedComment,
  FeedReview,
  INITIAL_REVIEW_COMMENTS,
  INITIAL_REVIEWS,
  SEED_AUTHOR_NAMES,
  MediaType,
  parseVideoId,
} from "@/types/feedData";
import type { FeedActivity } from "@/types/auth";
import { useAuthStore } from "@/store/useAuthStore";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { create } from "zustand";

interface FeedState {
  reviews: FeedView[];
  isLoading: boolean;
  onHydrateReviews: () => Promise<void>;
  onAddReview: (review: FeedReview) => Promise<void>;
  onUpdateReview: (review: FeedReview) => Promise<void>;
  onDeleteReview: (feedId: string) => Promise<void>;
  onAddComment: (feedId: string, comment: FeedComment) => Promise<void>;
  onUpdateComment: (feedId: string, commentId: string, content: string) => Promise<void>;
  onDeleteComment: (feedId: string, commentId: string) => Promise<void>;
  onToggleLike: (feedId: string) => Promise<void>;
  onToggleCommentLike: (feedId: string, commentId: string) => Promise<void>;
  onReportReview: (feedId: string, shouldReport: boolean, reason?: string) => Promise<void>;
}

export interface FeedCommentView extends FeedComment {
  author: string;
  authorImage?: string;
  isMine: boolean;
  liked: boolean;
  likedUserIds: string[];
}

export interface FeedView extends FeedReview {
  feedId: string;
  author: string;
  authorImage?: string;
  isMine: boolean;
  isFollowing: boolean;
  mediaId: number;
  mediaType: MediaType;
  mediaTitle: string;
  mediaPoster?: string;
  mediaMeta: string;
  liked: boolean;
  likedUserIds: string[];
  comments: number;
  commentsList: FeedCommentView[];
}

type FirestoreRecord = Record<string, unknown>;
type UserProfileRecord = {
  id?: number;
  nickname?: string;
  imgUrl?: string;
  community?: {
    feeds?: FeedActivity[];
    following?: string[];
  };
};
type MediaDetail = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath?: string;
  meta: string;
};

const FEEDS_COLLECTION = "feeds";
const COMMENTS_COLLECTION = "comments";
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

const mediaCache = new Map<string, MediaDetail>();
const authorCache = new Map<string, string>();
const authorImageCache = new Map<string, string>();

const readString = (data: FirestoreRecord, key: string, fallback = "") => {
  const value = data[key];
  return typeof value === "string" ? value : fallback;
};

const readNumber = (data: FirestoreRecord, key: string, fallback = 0) => {
  const value = data[key];
  return typeof value === "number" ? value : fallback;
};

const readBoolean = (data: FirestoreRecord, key: string, fallback = false) => {
  const value = data[key];
  return typeof value === "boolean" ? value : fallback;
};

const readStringArray = (data: FirestoreRecord, key: string) => {
  const value = data[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
};

const getAuthContext = () => {
  const { user, currentProfile } = useAuthStore.getState();
  const storeUserId = user?.userId || (user as { uid?: string } | null)?.uid;
  const userId = storeUserId || auth.currentUser?.uid;

  return {
    userId,
    currentProfile,
    actorId: userId && currentProfile ? `${userId}:${currentProfile.id}` : userId,
  };
};

const getCurrentProfiles = async (userId: string) => {
  const userDocRef = doc(db, "users", userId);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) return null;

  const userData = userDocSnap.data();
  const profiles = Array.isArray(userData.profile) ? userData.profile as UserProfileRecord[] : [];

  return {
    userDocRef,
    profiles,
  };
};

type FeedActivityType = FeedActivity["type"];

const isFeedActivity = (value: unknown): value is FeedActivity => (
  typeof value === "object" &&
  value !== null &&
  typeof (value as FeedActivity).feedId === "string" &&
  (
    (value as FeedActivity).type === "comment" ||
    (value as FeedActivity).type === "like" ||
    (value as FeedActivity).type === "report"
  )
);

const syncProfileFeedActivity = async (
  feedId: string,
  type: FeedActivityType,
  shouldInclude: boolean,
  commentId?: string,
  reason?: string,
) => {
  const { user, currentProfile } = useAuthStore.getState();
  const userId = user?.userId || (user as { uid?: string } | null)?.uid || auth.currentUser?.uid;
  if (!userId || !currentProfile) return;

  const profileData = await getCurrentProfiles(userId);
  if (!profileData) return;

  const profileIndex = profileData.profiles.findIndex((profile) => profile.id === currentProfile.id);
  if (profileIndex === -1) return;

  const updatedProfiles = [...profileData.profiles];
  const targetProfile = { ...updatedProfiles[profileIndex] };
  const currentActivities = (targetProfile.community?.feeds || []).filter(isFeedActivity);
  const isSameActivity = (activity: FeedActivity) => (
    activity.feedId === feedId &&
    activity.type === type &&
    (type !== "comment" || !commentId || activity.commentId === commentId)
  );
  const nextActivities = shouldInclude
    ? [
      ...currentActivities.filter((activity) => !isSameActivity(activity)),
      {
        feedId,
        type,
        ...(commentId ? { commentId } : {}),
        ...(reason ? { reason } : {}),
        createdAt: new Date().toISOString(),
      },
    ]
    : currentActivities.filter((activity) => !isSameActivity(activity));

  targetProfile.community = {
    ...targetProfile.community,
    feeds: nextActivities,
  };

  updatedProfiles[profileIndex] = targetProfile;
  await updateDoc(profileData.userDocRef, { profile: updatedProfiles });
};

const safelySyncProfileFeedActivity = async (
  feedId: string,
  type: FeedActivityType,
  shouldInclude: boolean,
  commentId?: string,
  reason?: string,
) => {
  try {
    await syncProfileFeedActivity(feedId, type, shouldInclude, commentId, reason);
  } catch (error) {
    console.error("피드 활동 기록 실패:", error);
  }
};

const getAuthorName = async (userId: string, profileId?: number) => {
  if (SEED_AUTHOR_NAMES[userId]) return SEED_AUTHOR_NAMES[userId];
  const authorCacheKey = profileId ? `${userId}:${profileId}` : userId;
  if (authorCache.has(authorCacheKey)) return authorCache.get(authorCacheKey)!;

  const { user, currentProfile } = useAuthStore.getState();
  const currentUserId = user?.userId || (user as { uid?: string } | null)?.uid || auth.currentUser?.uid;
  if (currentUserId === userId && currentProfile?.nickname && (!profileId || profileId === currentProfile.id)) {
    authorCache.set(authorCacheKey, currentProfile.nickname);
    return currentProfile.nickname;
  }

  try {
    const profileData = await getCurrentProfiles(userId);
    const profile = profileData?.profiles.find((item) => item.id === profileId) || profileData?.profiles[0];
    const author = profile?.nickname || "익명";
    authorCache.set(authorCacheKey, author);
    return author;
  } catch {
    return "익명";
  }
};

const getAuthorImage = async (userId: string, profileId?: number) => {
  if (SEED_AUTHOR_NAMES[userId]) return "";
  const authorCacheKey = profileId ? `${userId}:${profileId}` : userId;
  if (authorImageCache.has(authorCacheKey)) return authorImageCache.get(authorCacheKey);

  const { user, currentProfile } = useAuthStore.getState();
  const currentUserId = user?.userId || (user as { uid?: string } | null)?.uid || auth.currentUser?.uid;
  if (currentUserId === userId && currentProfile?.imgUrl && (!profileId || profileId === currentProfile.id)) {
    authorImageCache.set(authorCacheKey, currentProfile.imgUrl);
    return currentProfile.imgUrl;
  }

  try {
    const profileData = await getCurrentProfiles(userId);
    const profile = profileData?.profiles.find((item) => item.id === profileId) || profileData?.profiles[0];
    const authorImage = profile?.imgUrl || "";
    authorImageCache.set(authorCacheKey, authorImage);
    return authorImage;
  } catch {
    return "";
  }
};

const getMediaDetail = async (videoId: string): Promise<MediaDetail> => {
  if (mediaCache.has(videoId)) return mediaCache.get(videoId)!;

  const { mediaType, mediaId } = parseVideoId(videoId);
  const fallback: MediaDetail = {
    id: mediaId,
    mediaType,
    title: "제목 없음",
    meta: mediaType === "tv" ? "시리즈" : "영화",
  };

  if (!TMDB_KEY || !mediaId) return fallback;

  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${TMDB_KEY}&language=ko-KR`);
    const data = await res.json();
    const title = mediaType === "tv" ? data.name : data.title;
    const year = mediaType === "tv" ? data.first_air_date?.slice(0, 4) : data.release_date?.slice(0, 4);
    const average = typeof data.vote_average === "number" ? data.vote_average.toFixed(1) : "-";
    const detail = {
      id: mediaId,
      mediaType,
      title: title || fallback.title,
      posterPath: data.poster_path || "",
      meta: `${mediaType === "tv" ? "시리즈" : "영화"} · ${year || "연도 미상"} · 평균 ${average}`,
    };

    mediaCache.set(videoId, detail);
    return detail;
  } catch {
    return fallback;
  }
};

const normalizeComment = (commentId: string, data: FirestoreRecord): FeedComment => ({
  commentId,
  userId: readString(data, "userId"),
  profileId: readNumber(data, "profileId") || undefined,
  content: readString(data, "content"),
  reportsCount: readNumber(data, "reportsCount"),
  likesCount: readNumber(data, "likesCount"),
  createdAt: readString(data, "createdAt"),
  updatedAt: readString(data, "updatedAt"),
  isDelete: readBoolean(data, "isDelete"),
  likedUserIds: readStringArray(data, "likedUserIds"),
});

const normalizeFeed = (feedId: string, data: FirestoreRecord): FeedReview => ({
  feedId,
  userId: readString(data, "userId"),
  videoId: readString(data, "videoId"),
  content: readString(data, "content"),
  likesCount: readNumber(data, "likesCount"),
  reportsCount: readNumber(data, "reportsCount"),
  createdAt: readString(data, "createdAt"),
  updatedAt: readString(data, "updatedAt"),
  isDelete: readBoolean(data, "isDelete"),
  profileId: readNumber(data, "profileId") || undefined,
  rating: readNumber(data, "rating"),
  isSpoiler: readBoolean(data, "isSpoiler"),
  isPublic: readBoolean(data, "isPublic", true),
  likedUserIds: readStringArray(data, "likedUserIds"),
});

const buildCommentView = async (
  comment: FeedComment,
  currentUserId?: string,
  currentProfileId?: number,
): Promise<FeedCommentView> => {
  const likedUserIds = comment.likedUserIds || [];
  const currentActorId = currentUserId && currentProfileId ? `${currentUserId}:${currentProfileId}` : currentUserId;

  return {
    ...comment,
    author: await getAuthorName(comment.userId, comment.profileId),
    authorImage: await getAuthorImage(comment.userId, comment.profileId),
    isMine: Boolean(
      currentUserId &&
      comment.userId === currentUserId &&
      (!comment.profileId || comment.profileId === currentProfileId)
    ),
    liked: Boolean(currentActorId && likedUserIds.includes(currentActorId)),
    likedUserIds,
  };
};

const buildFeedView = async (
  review: FeedReview,
  commentsList: FeedComment[],
  currentUserId?: string,
  followingIds: string[] = [],
): Promise<FeedView> => {
  const media = await getMediaDetail(review.videoId);
  const likedUserIds = review.likedUserIds || [];
  const currentProfileId = useAuthStore.getState().currentProfile?.id;
  const currentActorId = currentUserId && currentProfileId ? `${currentUserId}:${currentProfileId}` : currentUserId;

  return {
    ...review,
    feedId: review.feedId || "",
    author: await getAuthorName(review.userId, review.profileId),
    authorImage: await getAuthorImage(review.userId, review.profileId),
    isMine: Boolean(
      currentUserId &&
      review.userId === currentUserId &&
      (!review.profileId || review.profileId === currentProfileId)
    ),
    isFollowing: followingIds.includes(review.userId),
    mediaId: media.id,
    mediaType: media.mediaType,
    mediaTitle: media.title,
    mediaPoster: media.posterPath,
    mediaMeta: media.meta,
    liked: Boolean(currentActorId && likedUserIds.includes(currentActorId)),
    likedUserIds,
    comments: commentsList.length,
    commentsList: await Promise.all(commentsList.map((comment) => buildCommentView(comment, currentUserId, currentProfileId))),
  };
};

const seedInitialFeeds = async () => {
  await Promise.all(INITIAL_REVIEWS.map(async (review) => {
    if (!review.feedId) return;

    const feedRef = doc(db, FEEDS_COLLECTION, review.feedId);
    const feedSnap = await getDoc(feedRef);
    if (!feedSnap.exists()) {
      const seedDoc = { ...review };
      delete seedDoc.feedId;
      await setDoc(feedRef, seedDoc);
    }

    const seedComments = INITIAL_REVIEW_COMMENTS[review.feedId] || [];
    await Promise.all(seedComments.map(async (comment) => {
      const commentRef = doc(db, FEEDS_COLLECTION, review.feedId!, COMMENTS_COLLECTION, comment.commentId);
      const commentSnap = await getDoc(commentRef);
      if (!commentSnap.exists()) {
        const { commentId, ...commentDoc } = comment;
        void commentId;
        await setDoc(commentRef, commentDoc);
      }
    }));
  }));
};

const fetchComments = async (feedId: string) => {
  const snapshot = await getDocs(collection(db, FEEDS_COLLECTION, feedId, COMMENTS_COLLECTION));

  return snapshot.docs
    .map((commentDoc) => normalizeComment(commentDoc.id, commentDoc.data()))
    .filter((comment) => !comment.isDelete)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const getSeedViews = async (currentUserId?: string, followingIds: string[] = []) => (
  Promise.all(INITIAL_REVIEWS.map((review) => (
    buildFeedView(review, INITIAL_REVIEW_COMMENTS[review.feedId || ""] || [], currentUserId, followingIds)
  )))
);

export const useFeedStore = create<FeedState>((set, get) => ({
  reviews: [],
  isLoading: false,

  onHydrateReviews: async () => {
    const { userId, currentProfile } = getAuthContext();
    const followingIds = currentProfile?.community?.following || [];

    set({ isLoading: true });

    try {
      await seedInitialFeeds();

      const snapshot = await getDocs(collection(db, FEEDS_COLLECTION));
      const reviews = await Promise.all(
        snapshot.docs
          .map((feedDoc) => normalizeFeed(feedDoc.id, feedDoc.data()))
          .filter((review) => !review.isDelete)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(async (review) => {
            const feedId = review.feedId || "";
            try {
              const commentsList = await fetchComments(feedId);
              return buildFeedView(review, commentsList, userId, followingIds);
            } catch (error) {
              console.error("피드 댓글 로드 실패:", feedId, error);
              return buildFeedView(review, [], userId, followingIds);
            }
          }),
      );

      set({ reviews, isLoading: false });
    } catch (error) {
      console.error("피드 로드 실패:", error);
      set({ reviews: await getSeedViews(userId, followingIds), isLoading: false });
    }
  },

  onAddReview: async (review) => {
    const { userId, currentProfile } = getAuthContext();
    if (!userId || !currentProfile) return;

    const now = new Date().toISOString();
    const newDoc: Omit<FeedReview, "feedId"> = {
      userId,
      profileId: currentProfile.id,
      videoId: review.videoId,
      content: review.content,
      likesCount: 0,
      reportsCount: 0,
      createdAt: now,
      updatedAt: now,
      isDelete: false,
      rating: review.rating,
      isSpoiler: review.isSpoiler,
      isPublic: review.isPublic,
      likedUserIds: [],
    };

    const docRef = await addDoc(collection(db, FEEDS_COLLECTION), newDoc);

    const nextReview = await buildFeedView({ ...newDoc, feedId: docRef.id }, [], userId, currentProfile.community?.following || []);
    set((state) => ({ reviews: [nextReview, ...state.reviews] }));
  },

  onUpdateReview: async (review) => {
    if (!review.feedId) return;

    const { userId, currentProfile } = getAuthContext();
    const updatedAt = new Date().toISOString();
    const feedDocRef = doc(db, FEEDS_COLLECTION, review.feedId);
    const updatedFields = {
      videoId: review.videoId,
      content: review.content,
      rating: review.rating,
      isSpoiler: review.isSpoiler,
      isPublic: review.isPublic,
      updatedAt,
    };

    await updateDoc(feedDocRef, updatedFields);
    const currentReview = get().reviews.find((item) => item.feedId === review.feedId);
    const followingIds = currentProfile?.community?.following || [];
    const nextReview = await buildFeedView(
      { ...review, ...updatedFields },
      currentReview?.commentsList || [],
      userId,
      followingIds,
    );

    set((state) => ({
      reviews: state.reviews.map((item) => (
        item.feedId === review.feedId ? nextReview : item
      )),
    }));
  },

  onDeleteReview: async (feedId) => {
    await updateDoc(doc(db, FEEDS_COLLECTION, feedId), {
      isDelete: true,
      updatedAt: new Date().toISOString(),
    });
    set((state) => ({
      reviews: state.reviews.filter((review) => review.feedId !== feedId),
    }));
  },

  onAddComment: async (feedId, comment) => {
    const { userId, currentProfile } = getAuthContext();
    if (!userId || !currentProfile) return;

    const now = new Date().toISOString();
    const newDoc: Omit<FeedComment, "commentId"> = {
      userId,
      profileId: currentProfile.id,
      content: comment.content,
      reportsCount: 0,
      likesCount: 0,
      likedUserIds: [],
      createdAt: now,
      updatedAt: now,
      isDelete: false,
    };

    const docRef = await addDoc(collection(db, FEEDS_COLLECTION, feedId, COMMENTS_COLLECTION), newDoc);
    const targetReview = get().reviews.find((review) => review.feedId === feedId);
    const isOtherProfileFeed = targetReview?.userId !== userId || targetReview.profileId !== currentProfile.id;
    if (isOtherProfileFeed) {
      await safelySyncProfileFeedActivity(feedId, "comment", true, docRef.id);
    }

    const nextComment = await buildCommentView({ ...newDoc, commentId: docRef.id }, userId, currentProfile.id);
    set((state) => ({
      reviews: state.reviews.map((review) => (
        review.feedId === feedId
          ? {
            ...review,
            comments: review.comments + 1,
            commentsList: [nextComment, ...review.commentsList],
          }
          : review
      )),
    }));
  },

  onUpdateComment: async (feedId, commentId, content) => {
    const updatedAt = new Date().toISOString();

    await updateDoc(doc(db, FEEDS_COLLECTION, feedId, COMMENTS_COLLECTION, commentId), {
      content,
      updatedAt,
    });

    set((state) => ({
      reviews: state.reviews.map((review) => {
        if (review.feedId !== feedId) return review;

        return {
          ...review,
          commentsList: review.commentsList.map((comment) => (
            comment.commentId === commentId
              ? { ...comment, content, updatedAt }
              : comment
          )),
        };
      }),
    }));
  },

  onDeleteComment: async (feedId, commentId) => {
    const { userId } = getAuthContext();
    await updateDoc(doc(db, FEEDS_COLLECTION, feedId, COMMENTS_COLLECTION, commentId), {
      isDelete: true,
      updatedAt: new Date().toISOString(),
    });
    if (userId) {
      await safelySyncProfileFeedActivity(feedId, "comment", false, commentId);
    }

    set((state) => ({
      reviews: state.reviews.map((review) => {
        if (review.feedId !== feedId) return review;

        const commentsList = review.commentsList.filter((comment) => comment.commentId !== commentId);

        return {
          ...review,
          comments: commentsList.length,
          commentsList,
        };
      }),
    }));
  },

  onToggleLike: async (feedId) => {
    const { userId, currentProfile, actorId } = getAuthContext();
    if (!userId || !currentProfile || !actorId) return;

    const targetReview = get().reviews.find((review) => review.feedId === feedId);
    if (!targetReview) return;

    const nextLiked = !targetReview.liked;
    const nextLikesCount = Math.max(0, targetReview.likesCount + (nextLiked ? 1 : -1));

    await updateDoc(doc(db, FEEDS_COLLECTION, feedId), {
      likesCount: nextLikesCount,
      likedUserIds: nextLiked ? arrayUnion(actorId) : arrayRemove(actorId),
    });
    if (targetReview.userId !== userId || targetReview.profileId !== currentProfile.id) {
      await safelySyncProfileFeedActivity(feedId, "like", nextLiked);
    }

    set((state) => ({
      reviews: state.reviews.map((review) => (
        review.feedId === feedId
          ? {
            ...review,
            liked: nextLiked,
            likesCount: nextLikesCount,
            likedUserIds: nextLiked
              ? [...new Set([...review.likedUserIds, actorId])]
              : review.likedUserIds.filter((id) => id !== actorId),
          }
          : review
      )),
    }));
  },

  onToggleCommentLike: async (feedId, commentId) => {
    const { userId, currentProfile, actorId } = getAuthContext();
    if (!userId || !currentProfile || !actorId) return;

    const targetReview = get().reviews.find((review) => review.feedId === feedId);
    const targetComment = targetReview?.commentsList.find((comment) => comment.commentId === commentId);
    if (!targetReview || !targetComment) return;

    const nextLiked = !targetComment.liked;
    const nextLikesCount = Math.max(0, targetComment.likesCount + (nextLiked ? 1 : -1));

    await updateDoc(doc(db, FEEDS_COLLECTION, feedId, COMMENTS_COLLECTION, commentId), {
      likesCount: nextLikesCount,
      likedUserIds: nextLiked ? arrayUnion(actorId) : arrayRemove(actorId),
    });

    set((state) => ({
      reviews: state.reviews.map((review) => (
        review.feedId === feedId
          ? {
            ...review,
            commentsList: review.commentsList.map((comment) => (
              comment.commentId === commentId
                ? {
                  ...comment,
                  liked: nextLiked,
                  likesCount: nextLikesCount,
                  likedUserIds: nextLiked
                    ? [...new Set([...comment.likedUserIds, actorId])]
                    : comment.likedUserIds.filter((id) => id !== actorId),
                }
                : comment
            )),
          }
          : review
      )),
    }));
  },

  onReportReview: async (feedId, shouldReport, reason) => {
    const { userId, currentProfile } = getAuthContext();
    if (!userId || !currentProfile) return;

    const targetReview = get().reviews.find((review) => review.feedId === feedId);
    if (!targetReview) return;
    if (targetReview.userId === userId && targetReview.profileId === currentProfile.id) return;

    const reportsCount = Math.max(0, targetReview.reportsCount + (shouldReport ? 1 : -1));
    await updateDoc(doc(db, FEEDS_COLLECTION, feedId), { reportsCount });
    await safelySyncProfileFeedActivity(feedId, "report", shouldReport, undefined, reason);

    set((state) => ({
      reviews: state.reviews.map((review) => (
        review.feedId === feedId ? { ...review, reportsCount } : review
      )),
    }));
  },
}));
